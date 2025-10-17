package controller

import (
	"context"
	"fmt"

	"github.com/google/go-cmp/cmp"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog/v2"

	tamsv1alpha1 "k8s-controller/pkg/apis/tamscontroller/v1alpha1"
)

func newAwsSecret(store *tamsv1alpha1.Store) *corev1.Secret {
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      store.Name,
			Namespace: store.Namespace,
			OwnerReferences: []metav1.OwnerReference{
				*metav1.NewControllerRef(store, tamsv1alpha1.SchemeGroupVersion.WithKind("Store")),
			},
		},
		Type: corev1.SecretTypeOpaque,
		Data: map[string][]byte{
			"AWS_ACCESS_KEY_ID":     []byte(store.Spec.Aws.AccessKeyId),
			"AWS_SECRET_ACCESS_KEY": []byte(store.Spec.Aws.SecretAccessKey),
		},
	}
}

func isAwsSecretUpToDate(store *tamsv1alpha1.Store, awsSecret *corev1.Secret) bool {
	expectedSecret := newAwsSecret(store)
	if awsSecret.Type != corev1.SecretTypeOpaque {
		return false
	}
	if !cmp.Equal(awsSecret.Data, expectedSecret.Data) {
		return false
	}
	return true
}

func (c *Controller) syncSecret(ctx context.Context, logger klog.Logger, store *tamsv1alpha1.Store) (*corev1.Secret, error) {
	needAwsSecret := false
	if store.Spec.Aws != nil {
		needAwsSecret = true
	}

	awsSecret, err := c.secretLister.Secrets(store.GetNamespace()).Get(store.GetName())
	if err != nil && !errors.IsNotFound(err) {
		return nil, err
	}
	if needAwsSecret && errors.IsNotFound(err) {
		awsSecret, err = c.kubeclientset.CoreV1().Secrets(store.GetNamespace()).Create(ctx, newAwsSecret(store), metav1.CreateOptions{FieldManager: FieldManager})
	}
	if !needAwsSecret && awsSecret != nil {
		logger.V(4).Info("Delete non required AWS secret resource")
		return nil, c.kubeclientset.CoreV1().Secrets(store.GetNamespace()).Delete(ctx, store.GetName(), metav1.DeleteOptions{})
	}
	if err != nil || awsSecret == nil {
		return nil, err
	}

	// If the Secret is not controlled by this Store resource, we log a
	// warning to the event recorder and return an error message.
	if !metav1.IsControlledBy(awsSecret, store) {
		msg := fmt.Sprintf(MessageResourceExists, awsSecret.Name)
		c.recorder.Event(store, corev1.EventTypeWarning, ErrResourceExists, msg)
		return nil, fmt.Errorf("%s", msg)
	}

	if !isAwsSecretUpToDate(store, awsSecret) {
		logger.V(4).Info("Update secret resource", "data")

		awsSecret, err = c.kubeclientset.CoreV1().Secrets(store.GetNamespace()).Update(ctx, newAwsSecret(store), metav1.UpdateOptions{FieldManager: FieldManager})
		if err != nil {
			return nil, err
		}
	}
	return awsSecret, nil
}
