package controller

import (
	"context"
	"fmt"
	"maps"
	"os"

	"github.com/google/go-cmp/cmp"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog/v2"

	tamsv1alpha1 "k8s-controller/pkg/apis/tamscontroller/v1alpha1"
)

const (
	image      = "ghcr.io/trackit/tams-service:latest"
	configPath = "/etc/tams/config.json"
	volumeName = "config-file"
)

func buildDeploymentServiceImage() string {
	valueFromEnv := os.Getenv("TAMS_SERVICE_IMAGE")
	if valueFromEnv != "" {
		return valueFromEnv
	}
	return image
}

// buildDeploymentLabels returns the labels for selecting the resources
// belonging to the given Store resource.
func buildDeploymentLabels(store *tamsv1alpha1.Store) map[string]string {
	return map[string]string{
		"app":        "tams",
		"controller": store.GetName(),
	}
}

// buildServiceAccountName returns the name of the ServiceAccount to use for
// the given Store resource.
func buildServiceAccountName(store *tamsv1alpha1.Store) string {
	if store.Spec.ServiceAccount != nil {
		return *store.Spec.ServiceAccount
	}
	return ""
}

// buildDeploymentPort returns the port to use for the given Store resource.
func buildDeploymentPort(store *tamsv1alpha1.Store) int32 {
	if store.Spec.Server.Port != nil {
		return *store.Spec.Server.Port
	}
	return 3000
}

// buildDeploymentEnvFrom returns the EnvFromSource for the given Store resource.
func buildDeploymentEnvFrom(store *tamsv1alpha1.Store) []corev1.EnvFromSource {
	if store.Spec.Aws == nil {
		return nil
	}
	return []corev1.EnvFromSource{
		{
			SecretRef: &corev1.SecretEnvSource{
				LocalObjectReference: corev1.LocalObjectReference{
					Name: store.GetName(),
				},
			},
		},
	}
}

// newDeployment creates a new Deployment for a Store resource. It also sets
// the appropriate OwnerReferences on the resource so handleObject can discover
// the Store resource that 'owns' it.
func newDeployment(store *tamsv1alpha1.Store) *appsv1.Deployment {
	labels := buildDeploymentLabels(store)
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      store.Name,
			Namespace: store.Namespace,
			OwnerReferences: []metav1.OwnerReference{
				*metav1.NewControllerRef(store, tamsv1alpha1.SchemeGroupVersion.WithKind("Store")),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: store.Spec.Replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: labels,
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "tams",
							Image: buildDeploymentServiceImage(),
							Env: []corev1.EnvVar{
								{
									Name:  "TAMS_CONFIG_PATH",
									Value: configPath,
								},
							},
							EnvFrom: buildDeploymentEnvFrom(store),
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      volumeName,
									MountPath: configPath,
									SubPath:   "config.json",
								},
							},
							Ports: []corev1.ContainerPort{
								{
									Name:          "http",
									ContainerPort: buildDeploymentPort(store),
									Protocol:      corev1.ProtocolTCP,
								},
							},
						},
					},
					ServiceAccountName: buildServiceAccountName(store),
					Volumes: []corev1.Volume{
						{
							Name: volumeName,
							VolumeSource: corev1.VolumeSource{
								ConfigMap: &corev1.ConfigMapVolumeSource{
									LocalObjectReference: corev1.LocalObjectReference{
										Name: store.GetName(),
									},
								},
							},
						},
					},
				},
			},
		},
	}
}

// isDeploymentUpToDate checks if the current Deployment is up to date with the
// desired configuration.
func isDeploymentUpToDate(store *tamsv1alpha1.Store, deployment *appsv1.Deployment) bool {
	expectedDeployment := newDeployment(store)
	expectedLabels := buildDeploymentLabels(store)
	// Check replicas matches expected configuration
	if store.Spec.Replicas != nil && (deployment.Spec.Replicas == nil || *store.Spec.Replicas != *deployment.Spec.Replicas) {
		return false
	}
	// Check selector matches expected configuration
	if deployment.Spec.Selector == nil || !maps.Equal(deployment.Spec.Selector.MatchLabels, expectedLabels) {
		return false
	}
	// Check template labels matches expected configuration
	if !maps.Equal(deployment.Spec.Template.ObjectMeta.Labels, expectedLabels) {
		return false
	}

	if deployment.Spec.Template.Spec.ServiceAccountName != buildServiceAccountName(store) {
		return false
	}

	// Check template volume matches expected configuration
	if len(deployment.Spec.Template.Spec.Volumes) != 1 {
		return false
	}
	var volume = deployment.Spec.Template.Spec.Volumes[0]
	if volume.Name != volumeName || volume.VolumeSource.ConfigMap == nil || volume.VolumeSource.ConfigMap.LocalObjectReference.Name != store.GetName() {
		return false
	}

	// Check template contains exactly one container
	if len(deployment.Spec.Template.Spec.Containers) != 1 {
		return false
	}

	var container = deployment.Spec.Template.Spec.Containers[0]
	var expectedContainer = expectedDeployment.Spec.Template.Spec.Containers[0]
	// Check image matches expected configuration
	if container.Name != "tams" {
		return false
	}
	if container.Image != buildDeploymentServiceImage() {
		return false
	}

	// Check environment variables matches expected configuration
	if !cmp.Equal(container.Env, expectedContainer.Env) {
		return false
	}
	// Check environment variables from secret matches expected configuration
	if !cmp.Equal(container.EnvFrom, expectedContainer.EnvFrom) {
		return false
	}
	// Check volume mounts matches expected configuration
	if !cmp.Equal(container.VolumeMounts, expectedContainer.VolumeMounts) {
		return false
	}
	// Check ports matches expected configuration
	if !cmp.Equal(container.Ports, expectedContainer.Ports) {
		return false
	}
	return true
}

// syncDeployment creates or updates a Deployment for a Store resource.
func (c *Controller) syncDeployment(ctx context.Context, logger klog.Logger, store *tamsv1alpha1.Store) (*appsv1.Deployment, error) {
	// Get the deployment with the name specified in Store.spec
	deployment, err := c.deploymentsLister.Deployments(store.GetNamespace()).Get(store.GetName())
	// If the resource doesn't exist, we'll create it
	if errors.IsNotFound(err) {
		deployment, err = c.kubeclientset.AppsV1().Deployments(store.GetNamespace()).Create(ctx, newDeployment(store), metav1.CreateOptions{FieldManager: FieldManager})
	}

	// If an error occurs during Get/Create, we'll requeue the item so we can
	// attempt processing again later.
	if err != nil {
		return nil, err
	}

	// If the Deployment is not controlled by this Store resource, we log a
	// warning to the event recorder and return an error message.
	if !metav1.IsControlledBy(deployment, store) {
		msg := fmt.Sprintf(MessageResourceExists, deployment.Name)
		c.recorder.Event(store, corev1.EventTypeWarning, ErrResourceExists, msg)
		return nil, fmt.Errorf("%s", msg)
	}

	// If the current deployment does not reflect the desired deployment, we should update the Deployment resource.
	if !isDeploymentUpToDate(store, deployment) {
		logger.V(4).Info("Update deployment resource")
		deployment, err = c.kubeclientset.AppsV1().Deployments(store.GetNamespace()).Update(ctx, newDeployment(store), metav1.UpdateOptions{FieldManager: FieldManager})
	}

	// If an error occurs during Update, we'll requeue the item so we can
	// attempt processing again later. This could have been caused by a
	// temporary network failure, or any other transient reason.
	if err != nil {
		return nil, err
	}

	return deployment, nil
}
