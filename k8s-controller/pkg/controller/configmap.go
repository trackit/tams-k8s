package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog/v2"

	tamsv1alpha1 "k8s-controller/pkg/apis/tamscontroller/v1alpha1"
)

type ConfigMap struct {
	Database tamsv1alpha1.StoreDatabaseCfg  `json:"database"`
	Backends []tamsv1alpha1.StoreBackendCfg `json:"backends"`
	Logs     tamsv1alpha1.StoreLogsCfg      `json:"logs"`
	Server   tamsv1alpha1.StoreServerCfg    `json:"server"`
}

// buildConfigMapLabels returns the labels that should be applied to the
// provided store ConfigMap.
func buildConfigMapLabels(store *tamsv1alpha1.Store) map[string]string {
	return map[string]string{
		"controller": store.GetName(),
	}
}

// marshalConfigMap returns the JSON encoding of the provided store.
func marshalConfigMap(store *tamsv1alpha1.Store) ([]byte, error) {
	var cfg = ConfigMap{
		Database: store.Spec.Database,
		Backends: store.Spec.Backends,
		Server:   store.Spec.Server,
		Logs:     store.Spec.Logs,
	}
	marshalledCfg, err := json.Marshal(&cfg)
	if err != nil {
		return nil, err
	}
	return marshalledCfg, nil
}

// newConfigMap creates a new ConfigMap for the given store. It also sets
// the appropriate OwnerReferences on the resource so handleObject can discover
// the Store resource that 'owns' it.
func newConfigMap(store *tamsv1alpha1.Store) (*corev1.ConfigMap, error) {
	marshalledCfg, err := marshalConfigMap(store)
	if err != nil {
		return nil, err
	}
	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      store.Name,
			Namespace: store.Namespace,
			OwnerReferences: []metav1.OwnerReference{
				*metav1.NewControllerRef(store, tamsv1alpha1.SchemeGroupVersion.WithKind("Store")),
			},
			Labels: buildConfigMapLabels(store),
		},
		Data: map[string]string{
			"config.json": string(marshalledCfg),
		},
	}, nil
}

// isConfigMapUpToDate checks if the current ConfigMap is up to date with the
// desired configuration.
func isConfigMapUpToDate(store *tamsv1alpha1.Store, currentConfig *corev1.ConfigMap) (bool, error) {
	// Check current labels matches expected configuration
	expectedLabels := buildConfigMapLabels(store)
	if !maps.Equal(currentConfig.GetLabels(), expectedLabels) {
		return false, nil
	}
	// Check config.json matches the expected configuration
	marshalledCfg, err := marshalConfigMap(store)
	if err != nil {
		return false, err
	}
	if currentConfig.Data["config.json"] != string(marshalledCfg) {
		return false, nil
	}
	if len(currentConfig.Data) > 1 {
		return false, nil
	}
	return true, nil
}

func (c *Controller) syncConfigMap(ctx context.Context, logger klog.Logger, store *tamsv1alpha1.Store) (*corev1.ConfigMap, error) {
	// Get the configmap with the name specified in Store
	configmap, err := c.configmapLister.ConfigMaps(store.GetNamespace()).Get(store.GetName())
	// If the resource doesn't exist, we'll create it
	if errors.IsNotFound(err) {
		cfg, err := newConfigMap(store)
		if err != nil {
			logger.V(2).Error(err, "Failed to create configmap")
			return nil, err
		}
		configmap, err = c.kubeclientset.CoreV1().ConfigMaps(store.GetNamespace()).Create(ctx, cfg, metav1.CreateOptions{FieldManager: FieldManager})
	}

	// If an error occurs during Get/Create, we'll requeue the item so we can
	// attempt processing again later.
	if err != nil {
		return nil, err
	}
	if configmap == nil {
		return nil, fmt.Errorf("configmap is not defined")
	}

	// If the Configmap is not controlled by this Store resource, we log a
	// warning to the event recorder and return an error message.
	if !metav1.IsControlledBy(configmap, store) {
		msg := fmt.Sprintf(MessageResourceExists, configmap.Name)
		c.recorder.Event(store, corev1.EventTypeWarning, ErrResourceExists, msg)
		return nil, fmt.Errorf("%s", msg)
	}

	// If the current config does not reflect the desired config, we should update the Configmap resource.
	if upToDate, err := isConfigMapUpToDate(store, configmap); err != nil {
		msg := fmt.Sprintf(MessageUnknownError, err.Error())
		c.recorder.Event(store, corev1.EventTypeWarning, ErrUnknownError, msg)
		return nil, err
	} else if upToDate == false {
		logger.V(4).Info("Update configmap resource", "config.json")
		cfg, err := newConfigMap(store)
		if err != nil {
			logger.V(2).Error(err, "Failed to create configmap")
			return nil, err
		}
		configmap, err = c.kubeclientset.CoreV1().ConfigMaps(store.Namespace).Update(ctx, cfg, metav1.UpdateOptions{FieldManager: FieldManager})
	}

	return configmap, nil
}
