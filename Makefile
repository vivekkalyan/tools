SHELL := bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c
.DELETE_ON_ERROR:
.DEFAULT_GOAL := help
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules


.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: format
format: ## Format with biome
	@bunx biome format --write

.PHONY: lint
lint: ## Lint with biome
	@bunx biome lint --fix

.PHONY: check-requirements
check-requirements: ## Ensure that all requirements are installed
	@command -v pre-commit > /dev/null 2>&1 || (echo "pre-commit not installed")

.PHONY: hooks
hooks: .git/hooks/pre-commit ## Run pre-commit hooks on all files
	pre-commit run --color=always --all-files --hook-stage commit

.git/hooks/pre-commit: .pre-commit-config.yaml
	pre-commit install
