# Kubernetes (K8S) Cluster with CI/CD pipelines
## System requirements
### Host system for Kubernetes
* Ubuntu 20.04 LTS Server amd64
* 8G RAM
* 4 Cores
* 20G Disk space
* Open SSH server

> * Server can be a virtual machine / bare metal
> * As running the K8S cluster for CI/CD, in prod, is expected to have a registered domain from Route53 or Google etc.

### Development system
* Any system with [Ansible installed](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)
* Can SSH to K8S host using SSH Key (preferred)

## System Setup
* create entry in `/etc/hosts` file
```
192.168.86.78 utmp
```
* create user `deploy` to login and deoply using Ansible
* Setup SSH login
```sh
$> ssh-copy-id deploy@utmp
```

## Just for executing Cluster
* Sequence of steps to execute/build the cluster
* create `ansible/vault.pass` with secret
* update `ansible/inventory/host_vars/utmp/vault.yml` with all required passwords
```sh
$> cd ansible
$> echo "some-password" > vault.pass
# add vault variables
$> vi inventory/host_vars/utmp/vault.yml
$> ansible-vault encrypt inventory/host_vars/utmp/vault.yml

$> ansible-playbook site.yml --tags "prepare"
$> ansible-playbook site.yml --tags "swag-up"
$> ansible-playbook site.yml --tags "registry-up"
$> ansible-playbook site.yml --tags "drone-up"

# after login to drone ui, make yourself admin
$> ansible-playbook site.yml --tags "drone-admin"
$> ansible-playbook site.yml --tags "drone-cli"

# install k3d cluster
$> ansible-playbook site.yml --tags "k3d"
$> watch kubectl get deployments -A

# optional helm charts
$> ansible-playbook site.yml --tags "helms"

# activate forked repo in drone ui
# set drone secrets for the forked repo
$> ansible-playbook site.yml --tags "drone-secrets"

# update and commit to master branch for pipeline execution
# open app at https://rnginx.uat.kube.(yourdomain)
```

## Prepare Project
* Clone [Repo](https://github.com/hareeshbabu82ns/k3d-cicd-demo)
  * `ansible` folder contains code to deploy the server
  * `react-nginx` folder contains sample React app to be deployed on K8S
* create `vault.pass` file with plain text password, under `ansible` folder
```
sample-secret-password-for-ansible-vault
```
* update `ansible/inventory/hosts.yml` with the IP address of server
* create passwords file `ansible/inventory/host_vars/utmp/vault.yml`

```yaml
# password to login to k8s server using
vault_become_pass: deploy

# root domain of your site (must be changed)
vault_root_domain: example.com

# route53 detail for the domain
vault_aws_dns_email: aws-user@gmail.com
vault_aws_r53_access_key_id: route53-access-id
vault_aws_r53_secret_access_key: route53-access-key

# docker registry password
vault_docker_pass: sample-docker-pass

# github auth for drone integration
vault_github_client_id: github-client-id
vault_github_client_secret: github-client-secret
# drone API token from user settings
vault_drone_api_key: drone-api-token

# to securely connect between drone server and runner
vault_rpc_secret: some-random-pass

# your github user id used in drone
vault_github_user: hareeshbabu82ns

# Slack webhook settings
vault_pipeline_notifier: "https://hooks.slack.com/services/T2../B0.."
vault_pipeline_notifier_oauth: "xoxb-7425..."

# k8s server url from `kubeconfig`
vault_k8s_server: "https://192.168.86.74:33333"
```

> All commands related to **Ansible** will be run from `ansible` directory

* encrypt the `vault.yml`
```sh
$> ansible-vault encrypt inventory/host_vars/utmp/vault.yml
```

## Run scripts to create K8S cluster
* To build the cluster, I used an awesome tool [k3d](https://k3d.io)
* `k3d` is a lightweight wrapper to run `k3s` (Rancher Lab’s minimal Kubernetes distribution) in docker.
* prepare the cluster
```sh
$> ansible-playbook site.yml --tags "prepare"
```
* preparing cluster involves
  * upgrading ubuntu system
  * installing docker
  * installing kubectl
  * installing k3d binaries
  * installing pip support packages

## Docker apps setup

### Nginx reverse-proxy
* `swag` reverse-proxy is used to
  * provide SSL certificates using `Let's Encrypt` using `Route53` dns authorization
  * serve HTTPS routing to all the pods exposed within k8s cluster
* install
  ```sh
  $> ansible-playbook site.yml --tags "swag-up"
  ```
* shutdown
  ```sh
  $> ansible-playbook site.yml --tags "swag-down"
  ```
* delete
  ```sh
  $> ansible-playbook site.yml --tags "swag-teardown"
  ```    
* customize the DNS details in `ansible/roles/swag/templates`

### Docker Registry v2
* `registry:2` is used to self host private docker registry
* used to build and deploy docker images from k8s cluster
* install
  ```sh
  $> ansible-playbook site.yml --tags "registry-up"
  ```
* shutdown
  ```sh
  $> ansible-playbook site.yml --tags "registry-down"
  ```
* delete
  ```sh
  $> ansible-playbook site.yml --tags "registry-teardown"
  ```    
* exposed as https://docker.example.com
* customize `ansible/roles/registry/templates`

### [Drone](https://www.drone.io)
* `drone` is used to automate build and testing process
* used ad CI/CD tool
* `drone` is very flexible as it uses `docker container` as its first class citigens to build and deploy
* install
  ```sh
  $> ansible-playbook site.yml --tags "drone-up"
  ```
* shutdown
  ```sh
  $> ansible-playbook site.yml --tags "drone-down"
  ```
* delete
  ```sh
  $> ansible-playbook site.yml --tags "drone-teardown"
  ```    
* exposed as https://drone.example.com
* customize `ansible/roles/drone/templates`
* install drone cli to work with secrets
```sh
$> ansible-playbook site.yml --tags "drone-cli"
```

## K8S cluster setup
* start k3d
```sh
$> ansible-playbook site.yml --tags "k3d"
```
* above script installs following components
  * installs `k3d` cluster with 1 master and 2 worker nodes
  * uses `ansible/roles/k3d/master/templates` folder to deploy services and customize
  * mounts `persistent volumes` from local directory
  * create a `cluster admin service account` with registry secret to be accessed from `drone`
  * install helm charts
    * traefik for `in cluster` routing
    * certificate manager for SSL certificates
    * `racher` for k8s cluster management
  * copies `kubeconfig` to local system
* to delete the k3d cluster
```sh
$> ansible-playbook site.yml --tags "k3d-reset"
```
* watch the deployments finish
```sh
$> watch kubectl get deployments -A
```
* once all the deployments finished, we can visit https://rancher.uat.kube.example.com
* install additional `helms`
  * will install heimdall at https://heimdall.uat.kube.example.com
  * nginx web app at https://nginx.uat.kube.example.com
  * customize installs from `ansible/roles/k3d/helms/templates`
```sh
$> ansible-playbook site.yml --tags "helms"
```

## Pipeline Notifier Setup
* using Slack web hook, can be useful to get some notifications when the CI/CD process executes tasks
* please follow instructions to create a web hook at https://api.slack.com/messaging/webhooks
* add web hook url to `ansible/inventory/host_vars/utmp/vault.yml`
  * vault_pipeline_notifier - Webhook url
  * vault_pipeline_notifier_oauth - Oauth token

## CI/CD Pipelines Setup

### Drone config
* fork this repository to your github namespace
* goto https://drone.example.com
* search for the project `k3d-cicd-demo` in your namespace
* activate the project
* make the project `Trusted` from settings
__Note__: need to make yourself as `admin` (command provided above)
* publish the secrets for the project
```sh
$> ansible-playbook site.yml --tags "drone-secrets"
```
__Note__: can customize repository name `git_repo` in `ansible/roles/drone/tasks/main.yml`

### Executing Pipeline
* update the drone secrets
* update `.drone.yml` at the root folder if need to add more steps to perform on pipeline
* update the code in `react-nginx`
* commit to master branch
* go to https://drone.example.com to see the build process started
* go to details to see the build steps
* when build is finised as the last step it send notification using Slack web hook
* check the app deployment status on rancher ui
* finally go to https://rnginx.uat.kube.example.com to see the app deployed