package crd_config

type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

type TAMSDynamoDBRepository struct {
}

type TAMSRepository interface {
	GetType() string
}

type TAMSLogs struct {
	Level LogLevel
}

type TAMSServer struct {
	Port uint16
}

type TAMSSpec struct {
	Repository TAMSRepository
	Logs       TAMSLogs
	Server     TAMSServer
}

type TAMSConfig struct {
	Name      string
	Namespace string
	Spec      TAMSSpec
}
