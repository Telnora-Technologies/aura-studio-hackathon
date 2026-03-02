# AURA Studio — Infrastructure as Code (Bonus Points)
# Terraform configuration for Google Cloud resources

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  default     = "aura-studio-hack"
}

variable "region" {
  description = "GCP Region"
  default     = "us-central1"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "run.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
  ])

  project = var.project_id
  service = each.key
  disable_on_destroy = false
}

# Cloud Storage bucket
resource "google_storage_bucket" "assets" {
  name          = "${var.project_id}-assets"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true
}

# Make bucket publicly readable
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Firestore database
resource "google_firestore_database" "default" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
}

# Service account
resource "google_service_account" "aura_sa" {
  account_id   = "aura-studio-sa"
  display_name = "AURA Studio Service Account"
}

# IAM roles for service account
resource "google_project_iam_member" "sa_roles" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/run.invoker",
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.aura_sa.email}"
}

# Artifact Registry
resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = "aura-studio-repo"
  format        = "DOCKER"
  description   = "AURA Studio Docker images"
}

# Cloud Run service
resource "google_cloud_run_v2_service" "backend" {
  name     = "aura-backend"
  location = var.region

  template {
    service_account = google_service_account.aura_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/aura-studio-repo/aura-backend:latest"

      ports {
        container_port = 8080
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.assets.name
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  depends_on = [google_project_service.apis]
}

# Allow unauthenticated access to Cloud Run
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "backend_url" {
  value = google_cloud_run_v2_service.backend.uri
}

output "storage_bucket" {
  value = google_storage_bucket.assets.name
}
