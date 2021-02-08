* run from root folder
```sh
$> ansible-playbook site.yml --tags "drone-up"
```
* to stop
```sh
$> ansible-playbook site.yml --tags "drone-down"
```

* to setup drone admin (only after user is created by logging in from UI)
```sh
$> ansible-playbook site.yml --tags "drone-admin"
```

* see available tags
```sh
$> ansible-playbook site.yml --list-tags
```

* see tasks which will execute
```sh
$> ansible-playbook site.yml --tags "drone-end" --list-tasks
```