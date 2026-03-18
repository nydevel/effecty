use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=../../frontend/src");
    println!("cargo:rerun-if-changed=../../frontend/index.html");
    println!("cargo:rerun-if-changed=../../frontend/package.json");
    println!("cargo:rerun-if-changed=../../frontend/tsconfig.json");
    println!("cargo:rerun-if-changed=../../frontend/vite.config.ts");

    let frontend_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../frontend");
    let dist_dir = frontend_dir.join("dist");

    // If dist/ already exists (e.g. pre-built in Docker), skip npm entirely
    if dist_dir.exists() {
        return;
    }

    if !frontend_dir.join("node_modules").exists() {
        let status = Command::new("npm")
            .arg("install")
            .current_dir(&frontend_dir)
            .status()
            .expect("failed to run npm install — is Node.js installed?");

        assert!(status.success(), "npm install failed");
    }

    let status = Command::new("npm")
        .args(["run", "build"])
        .current_dir(&frontend_dir)
        .status()
        .expect("failed to run npm run build");

    assert!(status.success(), "npm run build failed");
}
