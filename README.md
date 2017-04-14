
``` bash
$ npm install i
$ nrm run reproject ./static/geodata/france.json
```

Eventually if you want all intermediate files, you should use:
``` bash
$ nrm run reproject ./static/geodata/france.json -- --export
```

If you want to project with d3.geoConicConformal, you should use:
``` bash
$ nrm run reproject ./static/geodata/france.json -- --geoconic
```

If you want both of them, you should use:
``` bash
$ nrm run reproject ./static/geodata/france.json -- --export --geoconic
```
