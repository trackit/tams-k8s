package main

import (
	"context"
	"fmt"
	"path/filepath"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

func main() {
	var kubeconfig string

	if home := homedir.HomeDir(); home != "" {
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)

	if err != nil {
		fmt.Println("Falling back to in-cluster config")
		config, err = rest.InClusterConfig()
		if err != nil {
			panic(err.Error())
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}
	dynClient, err := dynamic.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	tams := schema.GroupVersionResource{Group: "trackit.io", Version: "v1", Resource: "tams"}

	informer := cache.NewSharedIndexInformer(&cache.ListWatch{
		ListFunc: func(options metav1.ListOptions) (runtime.Object, error) {
			return dynClient.Resource(tams).Namespace("").List(context.TODO(), options)
		},
		WatchFunc: func(options metav1.ListOptions) (watch.Interface, error) {
			return dynClient.Resource(tams).Namespace("").Watch(context.TODO(), options)
		},
	}, &unstructured.Unstructured{}, 0, cache.Indexers{})

	informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			cm := corev1.ConfigMap{
				TypeMeta: metav1.TypeMeta{
					Kind:       "ConfigMap",
					APIVersion: "v1",
				},
				ObjectMeta: metav1.ObjectMeta{
					Name:      "my-config-map",
					Namespace: "default",
				},
				Data: map[string]string{
					"test": "lol",
				},
			}

			clientset.CoreV1().ConfigMaps("default").Create(context.TODO(), &cm, metav1.CreateOptions{})
			fmt.Println("AddFunc", obj)
		},
		UpdateFunc: func(old, new interface{}) {
			fmt.Println("UpdateFunc", old, new)
		},
		DeleteFunc: func(obj interface{}) {
			fmt.Println("DeleteFunc", obj)
		},
	})

	stop := make(chan struct{})
	defer close(stop)

	go informer.Run(stop)

	if !cache.WaitForCacheSync(stop, informer.HasSynced) {
		panic("Timed out waiting for caches to sync")
	}

	fmt.Println("Custom Resource Controller started successfully")
	<-stop
}
