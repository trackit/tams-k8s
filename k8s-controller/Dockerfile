FROM golang:1.25.1-alpine AS builder

WORKDIR /tams-controller

COPY go.mod go.sum ./
RUN go mod download

COPY ./ ./

RUN CGO_ENABLED=0 GOOS=linux go build -o controller

FROM scratch

COPY --from=builder /tams-controller/controller /

ENTRYPOINT ["/controller"]
