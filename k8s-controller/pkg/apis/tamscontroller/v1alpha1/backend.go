package v1alpha1

import (
	"encoding/json"
	"errors"
)

type StoreBackendType string

var (
	S3BackendType StoreBackendType = "s3"
)

type StoreBackendCfg struct {
	typeName StoreBackendType
	s3Cfg    *S3BackendCfg
}

type S3BackendCfg struct {
	Id         string           `json:"id"`
	Default    *bool            `json:"default,omitempty"`
	Type       StoreBackendType `json:"type"`
	BucketName string           `json:"bucketName"`
	Region     *string          `json:"region,omitempty"`
	Endpoint   *string          `json:"endpoint,omitempty"`
}

func (c *StoreBackendCfg) GetType() StoreBackendType {
	return c.typeName
}

func (c *StoreBackendCfg) GetS3Cfg() *S3BackendCfg {
	return c.s3Cfg
}

func (c *StoreBackendCfg) UnmarshalJSON(b []byte) error {
	var cfgMap map[string]json.RawMessage
	err := json.Unmarshal(b, &cfgMap)
	if err != nil {
		return err
	}
	getTypeRaw, ok := cfgMap["type"]
	if !ok {
		return errors.New("missing type field")
	}
	var getType StoreBackendType
	err = json.Unmarshal(getTypeRaw, &getType)
	if err != nil {
		return err
	}
	switch getType {
	case S3BackendType:
		c.typeName = getType
		c.s3Cfg = &S3BackendCfg{}
		err = json.Unmarshal(b, c.s3Cfg)
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *StoreBackendCfg) MarshalJSON() ([]byte, error) {
	switch c.typeName {
	case S3BackendType:
		return json.Marshal(c.s3Cfg)
	}
	return nil, errors.New("unknown backend type")
}
