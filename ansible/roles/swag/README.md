* run from root folder
```sh
$> ansible-playbook site.yml --tags "swag-up"
```
* to stop
```sh
$> ansible-playbook site.yml --tags "swag-down"
```

* to delete with data
```sh
$> ansible-playbook site.yml --tags "swag-teardown"
```

* to enable AWS - route53
```sh
$> ansible-galaxy collection install community.aws
```