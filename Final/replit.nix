{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.npm
    pkgs.nodePackages.typescript
    pkgs.nodePackages.tsx
    pkgs.postgresql
  ];
}