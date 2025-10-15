#:package CommunityToolkit.Aspire.Hosting.NodeJS.Extensions@9.8.0
#:package Aspire.Hosting.NodeJs@13.0.0-preview.1.25515.3
#:package Aspire.Hosting.PostgreSQL@13.0.0-preview.1.25515.3
#:package Aspire.Hosting.Redis@13.0.0-preview.1.25515.3
#:package Aspire.Hosting.Yarp@13.0.0-preview.1.25515.3
#:sdk Aspire.AppHost.Sdk@13.0.0-preview.1.25515.3

var builder = DistributedApplication.CreateBuilder(args);

var pg = builder.AddPostgres("pg").AddDatabase("todos");
var cache = builder.AddRedis("cache");

var api = builder.AddNpmApp("api", "./api")
    .WithNpmPackageInstallation()
    .WithHttpEndpoint(port: 3000, env: "PORT")
    .WithReference(pg).WaitFor(pg)
    .WithReference(cache).WaitFor(cache)
    .WithHttpHealthCheck("/health")
    .WithOtlpExporter();

builder.AddYarp("web")
    .WithStaticFiles("./static")
    .WithConfiguration(c => c.AddRoute("/api/{**catch-all}", api));

builder.Build().Run();
