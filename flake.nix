{
  description = "ZS WebUI - Web interface for ZS Platform";

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
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = "zs-webui";
          inherit version;
          src = ./.;
          npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
          nodejs = pkgs.nodejs_24;
          installPhase = ''
            cp -r out $out
          '';
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [ nodejs_24 ];
        };
      }
    );
}