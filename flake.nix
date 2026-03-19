{
  description = "ZS WebUI - Web interface for Zerg Swarm and OpenZerg Agent";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        version = packageJson.version;
        
        buildUi = mode: pkgs.buildNpmPackage {
          pname = "${mode}-ui";
          inherit version;
          src = ./.;
          npmDepsHash = "sha256-3hu3EwMHFLS0dKMf/C4x0yctTqTHdKJ9WqzWT+Nhh5Q=";
          nodejs = pkgs.nodejs_24;
          npmBuildScript = "build:${mode}";
          installPhase = ''
            cp -r out $out
          '';
        };
      in
      {
        packages = {
          default = buildUi "swarm";
          swarm-ui = buildUi "swarm";
          agent-ui = buildUi "agent";
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [ nodejs_24 ];
        };
      }
    );
}