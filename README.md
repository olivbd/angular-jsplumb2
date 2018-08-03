# angular-jsplumb2

[![NPM](https://nodei.co/npm/angular-jsplumb2.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/angular-jsplumb2/)

> Allow to draw links between elements using [jsPlumb toolkit](http://www.jsplumb.org/).

## Table of contents
* [Installation](#installation)
* [Dependencies](#dependencies)
* [Example](#example)

## Installation

### Bower
```sh
bower install angular-jsplumb2 --save
```

### NPM
```sh
npm install angular-jsplumb2 --save
```

Then include angular-jsplumb2.js in your HTML with it's dependencies (**Note** : As mentionned above, you can only load jquery ui dependency files) :

```html
<script src="jquery.js"></script>
<script src="jquery-ui.js"></script>
<script src="jsplumb.js"></script>
<script src="angular.js"></script>
<script src="angular-jsplumb2.js"></script>
```

And then load the module in your application by adding it as a dependent module:

```js
angular.module('app', ['angular-jsplumb2']);
```

### Get the sources
```sh
git clone https://github.com/olivbd/angular-jsplumb2.git
cd angular-jsplumb2
npm install
bower install
```

You've developed a new cool feature? Fixed an annoying bug? We'd be happy
to hear from you!

Have a look in [CONTRIBUTING.md](https://github.com/olivbd/angular-jsplumb2/blob/master/CONTRIBUTING.md)


## Dependencies

- [jsPlumb](http://jsplumb.org)
- [jQuery UI](http://jqueryui.com/) as a dependency of jsPlumb.

If you are using grunt and grunt wiredep, overrides the jsPlumb dependency like this:

```js
wiredep: {
    overrides: {
        jsplumb: {
            main: 'dist/js/jsplumb.min.js'
        },
        'jquery-ui': {
            main: [
                'ui/minified/core.min.js',
                'ui/minified/widget.min.js',
                'ui/minified/mouse.min.js',
                'ui/minified/draggable.min.js',
                'ui/minified/droppable.min.js'
            ]
        }
    }
}
```

For jQuery UI, we only need draggable and droppable functionnalities (and the few core functionnalities). So we can load only these files.


## Example
First, make sure `jsplumb` is ready by calling `jsPlumbService.jsplumbInit` method:

```js
angular.module('app').controller('myAppCtrl', function ($scope, jsPlumbService) {
    $scope.jsplumbReady = false;

    jsPlumbService.jsplumbInit()['finally'](function () {
        $scope.jsplumbReady = true;
    });
});
```

Create an instance of `angular-jsplumb2` with the `jsplumbInstance` directive:

```html
<div data-ng-if="jsplumbReady"
     data-jsplumb-instance>
     …
</div>
```


## Run the tests

```sh
npm test
```


## Build the documentation

```sh
grunt ngdocs
```


## Related links

 * Contribute: https://github.com/olivbd/angular-jsplumb2/CONTRIBUTING.md
 * Report bugs: https://github.com/olivbd/angular-jsplumb2/issues
 * Get latest version: https://github.com/olivbd/angular-jsplumb2


## License

See https://github.com/olivbd/angular-jsplumb2/blob/master/LICENSE