import { GetServiceResponse as Service, StorageBackend } from "@tams-k8s/api";

export class ServiceMother {
  private readonly service: Service;

  static created(): ServiceMother {
    return new ServiceMother({
      name: "service",
      description: "description",
      type: "urn:x-tams:service",
      api_version: "1.0",
      service_version: "version",
      event_stream_mechanisms: [],
    });
  }

  build() {
    return this.service;
  }

  withName(name: string): ServiceMother {
    this.service.name = name;
    return this;
  }

  withDescription(description: string): ServiceMother {
    this.service.description = description;
    return this;
  }

  withType(type: string): ServiceMother {
    this.service.type = type;
    return this;
  }

  withApiVersion(apiVersion: string): ServiceMother {
    this.service.api_version = apiVersion;
    return this;
  }

  withServiceVersion(serviceVersion: string): ServiceMother {
    this.service.service_version = serviceVersion;
    return this;
  }

  withEventStreamMechanisms(eventStreamMechanisms: []): ServiceMother {
    this.service.event_stream_mechanisms = eventStreamMechanisms;
    return this;
  }

  constructor(service: Service) {
    this.service = service;
  }
}

export class StorageBackendMother {
  private readonly storageBackend: StorageBackend;

  static created(): StorageBackendMother {
    return new StorageBackendMother({
      id: "test-id",
      label: "test-label",
      store_type: "test-store-type",
      store_product: "test-store-product",
      provider: "test-provider",
      region: "test-region",
      availability_zone: "test-availability-zone",
    });
  }

  withId(id: string): StorageBackendMother {
    this.storageBackend.id = id;
    return this;
  }

  withLabel(label: string): StorageBackendMother {
    this.storageBackend.label = label;
    return this;
  }

  withStoreType(storeType: string): StorageBackendMother {
    this.storageBackend.store_type = storeType;
    return this;
  }

  withStoreProduct(storeProduct: string): StorageBackendMother {
    this.storageBackend.store_product = storeProduct;
    return this;
  }

  withProvider(provider: string): StorageBackendMother {
    this.storageBackend.provider = provider;
    return this;
  }

  withRegion(region: string): StorageBackendMother {
    this.storageBackend.region = region;
    return this;
  }

  withAvailabilityZone(availabilityZone: string): StorageBackendMother {
    this.storageBackend.availability_zone = availabilityZone;
    return this;
  }

  build() {
    return this.storageBackend;
  }

  constructor(storageBackend: StorageBackend) {
    this.storageBackend = storageBackend;
  }
}
