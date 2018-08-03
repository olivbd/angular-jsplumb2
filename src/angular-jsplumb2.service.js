/**
 * @ngdoc service
 * @name angular-jsplumb2.jsPlumbService
 * @description
 *
 * Main service
 */
angular.module("angular-jsplumb2")
	.service("jsPlumbService", function ($q) {

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
	}
	);
