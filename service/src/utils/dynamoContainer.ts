import {
  GenericContainer,
  StartedTestContainer,
  Wait,
  PullPolicy,
} from "testcontainers";

export class DynamoDBTestContainer {
  private container?: StartedTestContainer;
  private endpoint?: string;

  static async isDockerAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import("child_process");
      execSync("docker info", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  async start(): Promise<string> {
    if (this.container) {
      return this.endpoint!;
    }

    const dockerAvailable = await DynamoDBTestContainer.isDockerAvailable();
    if (!dockerAvailable) {
      throw new Error(
        "Docker is not running. Please start Docker to run these tests."
      );
    }

    this.container = await new GenericContainer("amazon/dynamodb-local")
      .withExposedPorts(8000)
      .withCommand(["-jar", "DynamoDBLocal.jar", "-inMemory", "-sharedDb"])
      .withWaitStrategy(
        Wait.forAll([
          Wait.forLogMessage(/Initializing DynamoDB Local/),
          Wait.forListeningPorts(),
        ])
      )
      .withPullPolicy(PullPolicy.alwaysPull())
      .start();

    const port = this.container.getMappedPort(8000);
    this.endpoint = `http://${this.container.getHost()}:${port}`;

    return this.endpoint;
  }

  async stop(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = undefined;
      this.endpoint = undefined;
    }
  }

  getEndpoint(): string {
    if (!this.endpoint) {
      throw new Error("Container not started. Call start() first.");
    }
    return this.endpoint;
  }

  isRunning(): boolean {
    return !!this.container;
  }
}
