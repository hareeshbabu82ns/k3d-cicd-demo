* run from root folder
```sh
$> ansible-playbook site.yml --tags "registry-up"
```
* to stop
```sh
$> ansible-playbook site.yml --tags "registry-down"
```

* to delete with data
```sh
$> ansible-playbook site.yml --tags "registry-teardown"
```

* to enable AWS - route53
```sh
$> ansible-galaxy collection install community.aws
```