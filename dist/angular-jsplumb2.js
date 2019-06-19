angular.module("angular-jsplumb2", []);

/**
 * @ngdoc directive
 * @name angular-jsplumb2.directive:jsplumbEndpoint
 * @scope
 * @restrict A
 * @param  {String} id                          Identifier of the endpoint
 * @param  {Array@} jsplumbEndpointConnectionIds Identifiers to link to
 * @param {Object} jsplumbEndpointSourceOptions Options of the endpoint as source
 * @param {Object} jsplumbEndpointTargetOptions Options of the endpoint as target
 * @description
 * <p>Create a graph endpoint</p>
 * @example
 <example module="myApp">
    <file name="script.js">
        angular.module('myApp', [])
        angular.module("myApp").controller("foo", function() {
            var self = this;

            this.instanceOptions = {
                    PaintStyle : {
                        lineWidth : 2,
                        strokeStyle : "#354291"
                    },
                    HoverPaintStyle : {
                        lineWidth : 4,
                        strokeStyle : "#354291"
                    },
                    MaxConnections : -1
            };

            this.anchors = {
                    bottom : {
                    source : {
                        anchor : [0.5, 0.5, 0, 1],
                        connector: connector
                    },
                    target : {
                        anchor : [0.5, 0.5, 0, 1],
                        connector: connector
                    }
                },
                top : {
                    source : {
                        anchor : [0.5, 0.5, 0, -1],
                        connector: connector
                    },
                    target : {
                        anchor : [0.5, 0.5, 0, -1],
                        connector: connector
                    }
                }
            };

            $scope.$on("jsplumb.instance.created", function (evt, instance) {
                self.jsPlumb = instance;
                instance.Defaults.Container=$("body");
            });

            function init() {
                self.jsplumbReady = false;
                jsPlumbService.jsplumbInit().finally(function () {
                    self.jsplumbReady = true;
                });

            }

            init();
        });
    </file>
    <file name="index.html">
        <div data-ng-if="Foo.jsplumbReady" data-jsplumb-instance="Foo.instanceOptions">
            <div id="one"
                    data-jsplumb-endpoint-source-options="Foo.endpointOptions.top.source"
                    data-jsplumb-endpoint-target-options="Foo.endpointOptions.bottom.target"
                    data-jsplumb-endpoint-connection-ids="[]">hello world</div>

            <div id="two"
                    data-jsplumb-endpoint-source-options="Foo.endpointOptions.top.source"
                    data-jsplumb-endpoint-target-options="Foo.endpointOptions.bottom.target"
                    data-jsplumb-endpoint-connection-ids="['one']">hello world</div>
        </div>
    </file>
 </example>
 */
angular.module("angular-jsplumb2").directive("jsplumbEndpoint", ($rootScope, $parse) => {

	"use strict";

	return {
		restrict: "A",
		require: "^jsplumbInstance",
		scope: true,
		compile () {
			return {
				post ($scope, $element, attr, instanceCtrl) {

					$scope.attr = attr;

					$scope.$applyAsync(() => {
						const jsplumbInstance = instanceCtrl.getInstance();
						const endpointSourceOptions = $parse(attr.jsplumbEndpointSourceOptions)($scope);
						const endpointTargetOptions = $parse(attr.jsplumbEndpointTargetOptions)($scope);

						$scope.connectionIds = $parse(attr.jsplumbEndpointConnectionIds)($scope) || [];

						// add class to element
						$element.addClass("_jsPlumb_ng_endpoint");

						// create endpoint source
						if (endpointSourceOptions) {
							jsplumbInstance.makeSource($element, endpointSourceOptions);
						}

						// create endpoint target
						if (endpointTargetOptions) {
							jsplumbInstance.makeTarget($element, endpointTargetOptions);
						}

						$scope.$watch("attr.jsplumbEndpointConnectionIds", (nIds, oIds) => {
							const newIds = $parse(nIds)() || [];
							const oldIds = $parse(oIds)() || [];

							const deletedIds = _.difference(oldIds, newIds) || [];

							if (newIds && newIds.length) {
								instanceCtrl.connectEndpointsMultiple($element.attr("id"), newIds);
							}

							if (deletedIds && deletedIds.length) {
								instanceCtrl.disconnectEndpointsMultiple($element.attr("id"), deletedIds);
							}
						});

						$scope.$watch("attr.jsplumbEndpointEnabled", (nVal, oVal) => {
							const newVal = $parse(nVal)();
							const oldVal = $parse(oVal)();

							if (newVal === undefined && oldVal === undefined) {
								return;
							}

							jsplumbInstance.setSourceEnabled($element, newVal);
							jsplumbInstance.setTargetEnabled($element, newVal);

						});

						$scope.$watch("attr.id", (newId, oldId) => {
							$rootScope.$broadcast("jsplumb.endpoint.idChanged", newId, oldId);
						});

						$rootScope.$broadcast("jsplumb.endpoint.created", $element.attr("id"), $scope.connectionIds, jsplumbInstance);

						$scope.$on("$destroy", () => {
							jsplumbInstance.removeAllEndpoints($element);
							jsplumbInstance.remove($element);
							jsplumbInstance.repaintEverything();
						});
					});

				}
			};
		}
	};

});

"use strict";

angular.module("angular-jsplumb2")
	.controller("jsplumbInstanceCtrl", ["$scope", "$timeout", "$window", function ($scope, $timeout, $window) {

		const self = this;

		this.getInstance = function () {
			return $scope.instance;
		};

		this.connectionForecast = [];

		// Make a connection between 2 endpoints
		this.connectEndpoints = function (sourceId, targetId) {
			// If source endpoint is disabled, temporary re-enable it
			let deactiveSourceAfterConnect = false;
			if (!$scope.instance.isSourceEnabled(sourceId)) {
				deactiveSourceAfterConnect = true;
				$scope.instance.setSourceEnabled(sourceId, true);
			}

			// If target endpoint is disabled, temporary re-enable it
			let deactiveTargetAfterConnect = false;
			if (!$scope.instance.isTargetEnabled(targetId)) {
				deactiveTargetAfterConnect = true;
				$scope.instance.setTargetEnabled(targetId, true);
			}

			// If already linked (ex: temporary/dashed connection): disconnect it
			if (self.connectionExists(sourceId, targetId)) {
				self.disconnectEndpoints(sourceId, targetId);
			}

			// Let's connect!
			const connection = $scope.instance.connect({
				source: sourceId,
				target: targetId
			});

			// Re-disable target endpoint, if it was disabled
			if (deactiveTargetAfterConnect) {
				$scope.instance.setTargetEnabled(targetId, false);
			}

			// Re-disable source endpoint, if it was disabled
			if (deactiveSourceAfterConnect) {
				$scope.instance.setSourceEnabled(sourceId, false);
			}

			return connection;
		};

		// Detach connection between 2 endpoints
		this.disconnectEndpoints = function (sourceIdOrConnection, targetIdTmp) {
			let sourceId = sourceIdOrConnection;
			let targetId = targetIdTmp;
			let connection = sourceIdOrConnection;
			if (!targetId) {
				// 1st param is a connection; so we need to get IDs
				sourceId = sourceIdOrConnection.sourceId;
				targetId = sourceIdOrConnection.targetId;
			} else {
				// Else, we have IDs, so get connection
				connection = self.getConnection(sourceId, targetId);
			}

			_.remove(self.connectionForecast, { sourceId, targetId });

			if (connection) {
				// If source endpoint is disabled, temporary re-enable it
				let deactiveSourceAfterConnect = false;
				if (!$scope.instance.isSourceEnabled(sourceId)) {
					deactiveSourceAfterConnect = true;
					$scope.instance.setSourceEnabled(sourceId, true);
				}

				// If target endpoint is disabled, temporary re-enable it
				let deactiveTargetAfterConnect = false;
				if (!$scope.instance.isTargetEnabled(targetId)) {
					deactiveTargetAfterConnect = true;
					$scope.instance.setTargetEnabled(targetId, true);
				}

				// Let's disconnect!
				$scope.instance.deleteConnection(connection);

				// Re-disable target endpoint, if it was disabled
				if (deactiveTargetAfterConnect) {
					$scope.instance.setTargetEnabled(targetId, false);
				}

				// Re-disable source endpoint, if it was disabled
				if (deactiveSourceAfterConnect) {
					$scope.instance.setSourceEnabled(sourceId, false);
				}
			}
			return connection;
		};

		this.connectEndpointsMultiple = function (sourceId, targetListTmp) {
			// forecast this connection
			targetListTmp.forEach((id) => {
				if (!_.find(self.connectionForecast, { sourceId, targetId: id })) {
					self.connectionForecast.push({ sourceId, targetId: id });
				}
			});

			// filter target endpoints to be sure that they are already created by jsplumb and that connection does not exists yet
			const targetList = checkConnections(sourceId, targetListTmp);

			// connect filtered endpoint target
			if (targetList.length) {
				angular.forEach(targetList, (targetId) => {
					// Let's connect!
					self.connectEndpoints(sourceId, targetId);
				});
			}
		};

		this.disconnectEndpointsMultiple = function (sourceId, targetList) {
			angular.forEach(targetList, (targetId) => {
				// Let's disconnect!
				self.disconnectEndpoints(sourceId, targetId);
			});
		};

		this.getConnection = function (sourceId, targetId) {
			const connections = $scope.instance.getAllConnections();
			return _.find(connections, { sourceId, targetId }) || _.find(connections, { sourceId: targetId, targetId: sourceId });
		};

		this.getConnections = function (id) {
			const connections = $scope.instance.getAllConnections();
			return _.filter(connections, (conn) => (conn.sourceId === id) || (conn.targetId === id));
		};

		this.connectionExists = function (sourceId, targetId) {
			return !!self.getConnection(sourceId, targetId);
		};

		function checkConnections (endpointId, endpointConnectionIds) {
			const targetList = [];

			// check if source is already linked to instance and find already created targets
			if ($scope.instance.isSource(endpointId)) {
				angular.forEach(endpointConnectionIds, (endpointConnectionId) => {
					if ($scope.instance.isTarget(endpointConnectionId)/* && self.getConnection(endpointId, endpointConnectionId) === null*/) {
						targetList.push(endpointConnectionId);
					}
				});
			}

			return targetList;
		}

		$scope.$on("jsplumb.endpoint.idChanged", (evt, newId, oldId) => {
			// remove old connections
			if (oldId && (oldId !== newId)) {
				self.getConnections(oldId)
					.forEach((conn) => {
						self.disconnectEndpoints(conn.sourceId, conn.targetId);
					});
			}

			// Create new connections
			self.connectionForecast
				.filter((conn) => (conn.sourceId === newId) || (conn.targetId === newId))
				.forEach((conn) => {
					$scope.instance.connect({
						source: conn.sourceId,
						target: conn.targetId
					});
				});
		});

		$scope.$on("jsplumb.endpoint.created", (evt, endpointId, endpointConnectionIds) => {
			self.connectEndpointsMultiple(endpointId, endpointConnectionIds);
		});

		const onResizePage = _.debounce(() => {
			$timeout(() => {
				if ($scope.instance) {
					$scope.instance.revalidateEverything();
				}
			});
		}, 33);

		$scope.$on("$destroy", () => {
			if ($scope.instance) {
				$(window)
					.off("resize", onResizePage);
				$scope.instance.reset();
			}
			$scope.instance = null;
		});

		$(window)
			.on("resize", onResizePage);

		/**
		 * window.on("resize") is not triggered when scrollbar appears and might cause a display bug.
		 * We need to watch the window element to handle the scrollbar display. We also need to keep
		 * the window.on("resize") binding because it will be triggered as soon as window is resized.
		 */
		const windowElt = angular.element($window);
		$scope.$watch(() => ({
			h: windowElt.height(),
			w: windowElt.width()
		}), onResizePage, true);

		$scope.$on("jsplumb.endpoint.created", onResizePage);

	}]);

/**
 * @ngdoc directive
 * @name angular-jsplumb2.directive:jsplumbInstance
 * @scope
 * @restrict A
 * @description
 *
 * Create the jsPlumb environment
 *
 * @example
 <example module="myApp">
    <file name="script.js">
        angular.module("myApp", []);
        angular.module("myApp").controller("foo", function() {
            var self = this;

            this.instanceOptions = {
                    PaintStyle : {
                        lineWidth : 2,
                        strokeStyle : "#354291"
                    },
                    HoverPaintStyle : {
                        lineWidth : 4,
                        strokeStyle : "#354291"
                    },
                    MaxConnections : -1
            };


            $scope.$on("jsplumb.instance.created", function (evt, instance) {
                self.jsPlumb = instance;
                instance.Defaults.Container=$("body");
            });

            function init() {
                self.jsplumbReady = false;
                jsPlumbService.jsplumbInit().finally(function () {
                    self.jsplumbReady = true;
                });

            }

            init();
        });
    </file>

    <file name="index.html">
        <div data-ng-if="Foo.jsplumbReady" data-jsplumb-instance="Foo.instanceOptions">

        </div>
    </file>
 </example>
 */
angular.module("angular-jsplumb2")
	.directive("jsplumbInstance", ($rootScope, $parse) => {

		"use strict";

		return {
			restrict: "A",
			scope: true,
			controller: "jsplumbInstanceCtrl",
			compile () {
				return {
					pre ($scope, $element, attr, jsplumbInstanceCtrl) {

						const instanceOptions = $parse(attr.jsplumbInstance)($scope);

						// add class to element
						$element.addClass("_jsPlumb_ng_instance");

						$scope.instance = jsPlumb.getInstance(angular.extend(instanceOptions || {}, { Container: $element }));

						/*= ==============================================
						=            Extend jsplumb instance            =
						===============================================*/

						/**
						 *  Clears the offset and size cache of each endpoints end then repaints all connections.
						 *  Useful when a connection is deleted and endpoints become empty. repaintEverything method does not repaint empty endpoints.
						 */
						$scope.instance.revalidateEverything = function () {
							const self = this;
							$("._jsPlumb_ng_endpoint")
								.each((index, elem) => {
									self.revalidate($(elem)
										.attr("id"));
								});
						};

						/**
						 *  Make a connection between 2 endpoints
						 */
						$scope.instance.connectEndpoints = function (sourceId, targetId) {
							return jsplumbInstanceCtrl.connectEndpoints(sourceId, targetId);
						};

						/**
						 *  Delete a connection (or by give it source and target IDs)
						 */
						$scope.instance.disconnectEndpoints = function (sourceIdOrConnection, targetId) {
							return jsplumbInstanceCtrl.disconnectEndpoints(sourceIdOrConnection, targetId);
						};

						/**
						 *  Return a jsplumb connection object by providing a source endpoint id and target endpoint id.
						 *  This method checks in both direction : from source to target or from target to source.
						 */
						$scope.instance.getConnectionBySourceIdAndTargetId = function (sourceId, targetId) {
							return jsplumbInstanceCtrl.getConnection(sourceId, targetId);
						};

						/* -----  End of Extend jsplumb instance  ------*/

						$rootScope.$broadcast("jsplumb.instance.created", $scope.instance);

						$scope.instance.bind("connection", (info, originalEvent) => {
							$rootScope.$broadcast("jsplumb.instance.connection", info.connection, info.sourceEndpoint, info.targetEndpoint, $scope.instance, originalEvent);

							// call apply only if it's not a programmatically connection
							if (originalEvent) {
								$scope.$apply();
							}
						});

						$scope.instance.bind("mouseover", (info, originalEvent) => {
							$rootScope.$broadcast("jsplumb.instance.connection.mouseover", info, $scope.instance, originalEvent);
						});

						$scope.instance.bind("mouseout", (info, originalEvent) => {
							$rootScope.$broadcast("jsplumb.instance.connection.mouseout", info, $scope.instance, originalEvent);
						});

						$scope.instance.bind("beforeDrop", (info) => !instanceOptions.DuplicateConnectionsAllowed && jsplumbInstanceCtrl.connectionExists(info.sourceId, info.targetId) ? null : info.connection);

						$scope.instance.bind("click", (connection, originalEvent) => {
							$rootScope.$broadcast("jsplumb.instance.connection.click", connection, $scope.instance, originalEvent);

							// call apply only if it's not a programmatically connection
							if (originalEvent) {
								$scope.$apply();
							}
						});

						$scope.instance.bind("connectionDetached", (info, originalEvent) => {
							$rootScope.$broadcast("jsplumb.instance.connection.detached", info.connection, info.sourceEndpoint, info.targetEndpoint, $scope.instance, originalEvent);

							// call apply only if it's not a programmatically connection
							if (originalEvent) {
								$scope.$apply();
							}
						});

					}
				};
			}
		};

	});

/**
 * @ngdoc service
 * @name angular-jsplumb2.jsPlumbService
 * @description
 *
 * Main service
 */
angular.module("angular-jsplumb2")
	.service("jsPlumbService", ["$q", function ($q) {

		"use strict";

		const initDeferred = $q.defer();

		/**
			 * @ngdoc function
			 * @name jsplumbInit
			 * @methodOf angular-jsplumb2.jsPlumbService
			 * @description
			 *
			 * Initialize jsPlumb
			 *
			 */
		this.jsplumbInit = function () {
			jsPlumb.ready(() => {
				initDeferred.resolve();
			});

			return initDeferred.promise;
		};

		/**
			 * @ngdoc function
			 * @name importDefaults
			 * @methodOf angular-jsplumb2.jsPlumbService
			 * @description
			 *
			 * Configure jsPlumb
			 *
			 */
		this.importDefaults = function (defaults) {
			jsPlumb.importDefaults(defaults);
		};
	}]
	);
