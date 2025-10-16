package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +genclient
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// Store is a specification for a Store resource
type Store struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   StoreSpec   `json:"spec"`
	Status StoreStatus `json:"status"`
}

// StoreSpec is the spec for a Foo resource
type StoreSpec struct {
	Database StoreDatabaseCfg `json:"database"`
	Logs     StoreLogsCfg     `json:"logs"`
	Server   StoreServerCfg   `json:"server"`
	Replicas *int32           `json:"replicas"`
}

// StoreStatus is the status for a Foo resource
type StoreStatus struct {
	AvailableReplicas int32 `json:"availableReplicas"`
}

// StoreServerCfg is the server configuration for a Store resource
type StoreServerCfg struct {
	Port *int32 `json:"port"`
}

// StoreLogsCfg is the log configuration for a Store resource
type StoreLogsCfg struct {
	Level string `json:"level"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// StoreList is a list of Foo resources
type StoreList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata"`

	Items []Store `json:"items"`
}
