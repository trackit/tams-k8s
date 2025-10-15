package crd_config

import (
	"errors"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func convertLogsFromMap(in map[string]interface{}) (*TAMSLogs, error) {
	levelStr, found, err := unstructured.NestedString(in, "level")
	if err != nil {
		return nil, err
	}
	var level LogLevel
	if found {
		level = LogLevel(levelStr)
	} else {
		level = LogLevelInfo
	}
	return &TAMSLogs{
		Level: level,
	}, nil
}

func convertServerFromMap(in map[string]interface{}) (*TAMSServer, error) {
	port, found, err := unstructured.NestedInt64(in, "port")
	if err != nil {
		return nil, err
	}
	if !found {
		port = 3000
	}
	return &TAMSServer{
		Port: uint16(port),
	}, nil
}

func convertSpecFromMap(in map[string]interface{}) (*TAMSSpec, error) {
	// extract block
	logsBlock, found, err := unstructured.NestedMap(in, "logs")
	if err != nil {
		return nil, err
	}
	if !found {
		logsBlock = map[string]interface{}{}
	}
	serverBlock, found, err := unstructured.NestedMap(logsBlock, "server")
	if err != nil {
		return nil, err
	}
	if !found {
		serverBlock = map[string]interface{}{}
	}

	// convert block
	logs, err := convertLogsFromMap(logsBlock)
	if err != nil {
		return nil, err
	}
	if logs == nil {
		return nil, errors.New("no logs block could be converted")
	}
	server, err := convertServerFromMap(serverBlock)
	if err != nil {
		return nil, err
	}
	if server == nil {
		return nil, errors.New("no server block could be converted")
	}
	return &TAMSSpec{
		Logs:   *logs,
		Server: *server,
	}, nil
}

func ConvertFromUnstruct(in *unstructured.Unstructured) (*TAMSConfig, error) {
	specBlock, found, err := unstructured.NestedMap(in.Object, "spec")
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, errors.New("spec not found")
	}

	spec, err := convertSpecFromMap(specBlock)
	if err != nil {
		return nil, err
	}
	if spec == nil {
		return nil, errors.New("no spec could be converted")
	}
	return &TAMSConfig{
		Name:      in.GetName(),
		Namespace: in.GetNamespace(),
		Spec:      *spec,
	}, nil
}
