variable "project_id" {
  description = "Existing Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Cloud Run region. Confirm pricing and availability in the Console."
  type        = string
  default     = "europe-west1"
}

variable "image" {
  description = "Pre-built and Trivy-scanned container image in Artifact Registry."
  type        = string
}
