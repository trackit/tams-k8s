package controller

import (
	tamsv1alpha1 "k8s-controller/pkg/apis/tamscontroller/v1alpha1"
	"maps"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	//image      = "nginx:latest"
	image      = "arthurknoep/tams-k8s:latest"
	configPath = "/etc/tams/config.json"
	volumeName = "config-file"
)

// buildDeploymentLabels returns the labels for selecting the resources
// belonging to the given Store resource.
func buildDeploymentLabels(store *tamsv1alpha1.Store) map[string]string {
	return map[string]string{
		"app":        "tams",
		"controller": store.GetName(),
	}
}

// isDeploymentUpToDate checks if the current Deployment is up to date with the
// desired configuration.
func isDeploymentUpToDate(store *tamsv1alpha1.Store, deployment *appsv1.Deployment, cfg *corev1.ConfigMap) bool {
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
	if len(deployment.Spec.Template.Spec.Volumes) != 1 {
		return false
	}
	// Check template volume matches expected configuration
	var volume = deployment.Spec.Template.Spec.Volumes[0]
	if volume.Name != volumeName || volume.VolumeSource.ConfigMap == nil || volume.VolumeSource.ConfigMap.LocalObjectReference.Name != cfg.GetName() {
		return false
	}
	// Check template contains exactly one container
	if len(deployment.Spec.Template.Spec.Containers) != 1 {
		return false
	}
	var container = deployment.Spec.Template.Spec.Containers[0]
	// Check image matches expected configuration
	if container.Name != "tams" || container.Image != image {
		return false
	}
	// Check environment variable matches expected configuration
	if len(container.Env) != 1 || container.Env[0].Name != "TAMS_CONFIG_PATH" || container.Env[0].Value != configPath {
		return false
	}
	if len(container.VolumeMounts) != 1 || container.VolumeMounts[0].Name != volumeName || container.VolumeMounts[0].MountPath != configPath || container.VolumeMounts[0].SubPath != "config.json" {
		return false
	}
	return true
}

// newDeployment creates a new Deployment for a Store resource. It also sets
// the appropriate OwnerReferences on the resource so handleObject can discover
// the Store resource that 'owns' it.
func newDeployment(store *tamsv1alpha1.Store, cfg *corev1.ConfigMap) *appsv1.Deployment {
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
							Image: image,
							Env: []corev1.EnvVar{
								{
									Name:  "TAMS_CONFIG_PATH",
									Value: configPath,
								},
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      volumeName,
									MountPath: configPath,
									SubPath:   "config.json",
								},
							},
						},
					},
					Volumes: []corev1.Volume{
						{
							Name: volumeName,
							VolumeSource: corev1.VolumeSource{
								ConfigMap: &corev1.ConfigMapVolumeSource{
									LocalObjectReference: corev1.LocalObjectReference{
										Name: cfg.GetName(),
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
