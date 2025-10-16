package v1alpha1

import (
	"encoding/json"
	"errors"
)

type StoreDatabaseType string

var (
	DynamoDBType StoreDatabaseType = "dynamodb"
	MemoryDBType StoreDatabaseType = "memory"
)

type DynamoDBDatabaseCfg struct {
	Type             StoreDatabaseType `json:"type"`
	FlowTableName    string            `json:"flowTableName"`
	ServiceTableName string            `json:"serviceTableName"`
	Region           *string           `json:"region,omitempty"`
	Endpoint         *string           `json:"endpoint,omitempty"`
}

type MemoryDatabaseCfg struct {
	Type StoreDatabaseType `json:"type"`
}

type StoreDatabaseCfg struct {
	typeName StoreDatabaseType
	ddbCfg   *DynamoDBDatabaseCfg
	memCfg   *MemoryDatabaseCfg
}

func (c *StoreDatabaseCfg) GetType() StoreDatabaseType {
	return c.typeName
}

func (c *StoreDatabaseCfg) GetDynamoDBCfg() *DynamoDBDatabaseCfg {
	return c.ddbCfg
}

func (c *StoreDatabaseCfg) GetMemoryDBCfg() *MemoryDatabaseCfg {
	return c.memCfg
}

func (c *StoreDatabaseCfg) UnmarshalJSON(b []byte) error {
	var cfgMap map[string]json.RawMessage
	err := json.Unmarshal(b, &cfgMap)
	if err != nil {
		return err
	}
	getTypeRaw, ok := cfgMap["type"]
	if !ok {
		return errors.New("type not found and is a required field")
	}
	var getType StoreDatabaseType
	err = json.Unmarshal(getTypeRaw, &getType)
	if err != nil {
		return err
	}
	c.typeName = getType
	switch getType {
	case DynamoDBType:
		c.ddbCfg = &DynamoDBDatabaseCfg{}
		err = json.Unmarshal(b, c.ddbCfg)
		if err != nil {
			return err
		}
	case MemoryDBType:
		c.memCfg = &MemoryDatabaseCfg{}
		err = json.Unmarshal(b, c.memCfg)
		if err != nil {
			return err
		}
	}
	return nil
}

func (c *StoreDatabaseCfg) MarshalJSON() ([]byte, error) {
	switch c.typeName {
	case DynamoDBType:
		return json.Marshal(c.ddbCfg)
	case MemoryDBType:
		return json.Marshal(c.memCfg)
	}
	return nil, errors.New("unknown database type")
}
