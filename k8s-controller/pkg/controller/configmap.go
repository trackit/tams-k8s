package controller

import (
	"encoding/json"
	"maps"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

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

// newConfigMap creates a new ConfigMap for the given store. It also sets
// the appropriate OwnerReferences on the resource so handleObject can discover
// the Store resource that 'owns' it.
func newConfigMap(store *tamsv1alpha1.Store) *corev1.ConfigMap {
	marshalledCfg, _ := marshalConfigMap(store)
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
	}
}
