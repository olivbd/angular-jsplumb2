/* eslint-disable no-console,no-underscore-dangle */
"use strict";

angular.module("angular-jsplumb2-test", [
	"angular-jsplumb2",
	"ui.bootstrap"
])
	.controller("mainController", function ($scope, $http, $timeout, jsPlumbService) {
		const self = this;
		const GRID = 25;
		const schemaSourceParams = {
			allowLoopback: true,
			anchor: "Continuous",
			connector: [
				"Straight"
			],
			endpoint: "Dot",
			filter: ".nodeConnect",
			isSource: true,
			maxConnections: 1000,
			onMaxConnections (info) {
				console.error(`Maximum connections (${info.maxConnections}) reached`);
			}
		};
		const schemaTargetParams = {
			allowLoopback: true,
			anchor: "Continuous",
			dropOptions: {
				hoverClass: "dragHover"
			},
			endpoint: "Dot",
			isTarget: true
		};
		const RelationsList = {
			"KEPLER_RELATION;REPRE_BY": {
				nom: "represented_by"
			},
			"KEPLER_RELATION;IS_A": {
				nom: "is_a"
			},
			"KEPLER_RELATION;DEFINED_BY": {
				nom: "defined_by"
			},
			"KEPLER_RELATION;COMPOSED_OF": {
				nom: "composed_of"
			},
			"KEPLER_RELATION;ELEMENT_OF": {
				nom: "element_of"
			},
			"KEPLER_RELATION;INHERITS": {
				nom: "inherits"
			},
			"KEPLER_RELATION;ARCHIVE_DE": {
				nom: "archive de"
			},
			"KEPLER_RELATION;TO_EXTENSION": {
				nom: "TO_EXTENSION"
			},
			"KEPLER_RELATION;WF_IS": {
				nom: "WF_IS"
			},
			"KEPLER_RELATION;WF_STATEOF": {
				nom: "WF_STATEOF"
			},
			"KEPLER_RELATION;WF_ACTION": {
				nom: "WF_ACTION"
			},
			"KEPLER_RELATION;WF_CURRENTSTATE": {
				nom: "WF_CURRENTSTATE"
			},
			"KEPLER_RELATION;WF_AFFECT": {
				nom: "WF_AFFECT"
			},
			"KEPLER_RELATION;SET_OF": {
				nom: "set_of"
			},
			"KEPLER_RELATION;HAVE": {
				nom: "have"
			},
			"KEPLER_RELATION;SET_DEFAULT": {
				nom: "set_default"
			},
			"KEPLER_RELATION;COMPONENT_OF": {
				nom: "component_of"
			}
		}
		;

		let
			jsplumbInstance = null;

		$scope.tab = {
			jspReady: false,
			loading: false,
			schema: {
				name: null,
				nodes: [],
				links: []
			},
			jspOptions: {
				Endpoint: [
					"Dot",
					{
						cssClass: "endpoint",
						radius: 8
					}
				],
				Connector: "Straight",
				ConnectionOverlays: [
					[
						"PlainArrow",
						{
							id: "arrow",
							length: 9,
							location: 1
						}
					],
					[
						"Label",
						{
							cssClass: "link",
							id: "label",
							label: "Nouveau lien"
						}
					]
				],
				Container: angular.element(".schema-editor").get(0),
				DuplicateConnectionsAllowed: true
			}
		};

		this.getNodeIdFromKid = function (kid) {
			let key = null;
			angular.forEach($scope.tab.schema.nodes, (node) => {
				if (node.kid === kid) {
					key = node.id;
				}
			});
			return key;
		};

		this.addLinkIsa = function (node) {
			/** @namespace node.objtype */
			if (node.objtype === "OBJECT") {
				const tmpLink = {
					type: "KEPLER_RELATION;IS_A",
					style: {
						color: "muted",
						dash: 5,
						width: 2
					}
				};
				angular.forEach($scope.tab.schema.nodes, (node2) => {
					if (node2.kid === node.isa) {
						const connection = jsplumbInstance.connect({
							source: `kn-node-${node.id}`,
							target: `kn-node-${self.getNodeIdFromKid(node2.kid)}`,
							connector: "Straight",
							cssClass: self.getLinkCSS(tmpLink),
							anchors: ["Continuous"]
						});
						if (connection) {
							connection.getOverlay("label")
								.setLabel(self.getLinkName(tmpLink));
							angular.element(connection.getOverlay("label").canvas)
								.addClass("link-readonly");
						}
					}
				});
			}

		};

		this.getLinkCSS = function (link) {
			return [
				"kn-link",
				`kn-link-color-${link.style.color}`,
				`kn-link-dash-${link.style.dash}`,
				`kn-link-width-${link.style.width}`
			].join(" ");
		};

		this.getLinkName = function (link) {
			let name = "";
			if (link.type !== null && link.type in RelationsList) {
				name = RelationsList[link.type].nom;
			}
			if (link.type !== "KEPLER_RELATION;IS_A") {
				name += `${" ("}${link.from.card === 999999999 ? "N" : link.from.card},${link.to.card === 999999999 ? "N" : link.to.card})`;
			}

			const $div = angular.element("<div/>");

			if (link.linker && link.linker.kid !== "0") {
				$div.append(angular.element("<span/>")
					.addClass("linker")
					.text(link.linker.name));
			}

			$div.append(angular.element("<span/>")
				.addClass("nom")
				.text(name));
			if (link.readOnly) {
				$div.addClass("readOnly");
			}
			return $div.html();
		};


		$scope.getName = function (node) {
			let value = null;
			angular.forEach(node.repre, (repre) => {
				if (repre.lang.kid === "K_NODE;UNIVERSEL") {
					value = repre.value;
				}
			});

			if (!value) {
				angular.forEach(node.repre, (repre) => {
					if (repre.lang.isa === "K_NODE;LANGUE" && repre.lang.kid === "K_NODE;FRANCAIS") {
						value = repre.value;
					}
				});
			}

			if (!value) {
				angular.forEach(node.repre, (repre) => {
					if (repre.lang.isa === "K_NODE;LANGUE") {
						value = repre.value;
					}
				});
			}

			if (!value) {
				angular.forEach(node.repre, (repre) => {
					if (!value) {
						value = repre.value;
					}
				});
			}

			return value;
		};

		this.init = function () {
			jsPlumbService.jsplumbInit()
				.then(() => {
					console.log(`${new Date().toISOString()} : jsplumb is initialized`);
					$scope.tab.jspReady = true;
					$timeout(() => {
						self.display();
					});
				});
		};

		this.display = function () {
			// suspend drawing and initialise.
			const $schemaEditor = angular.element(".schema-editor");
			const $nodeList = $schemaEditor.find(".node");

			jsplumbInstance.bind("beforeDetach", (e) => {
				console.log(e);
				return true;
			});
			jsplumbInstance.bind("beforeDrop", (e) => {
				console.log(e);
				return true;
			});

			// mettre à jour la position x/y en cas de déplacement
			jsplumbInstance.draggable($nodeList, {
				containment: $schemaEditor,
				stop (e) {
					console.log(e);
				},
				disabled: false,
				snapThreshold: 13,
				grid: [
					GRID,
					GRID
				]
			});
			jsplumbInstance.setDraggable($nodeList, true);

			if ($nodeList.length > 0) {
				jsplumbInstance.batch(() => {
					jsplumbInstance.makeSource($nodeList, schemaSourceParams);
					jsplumbInstance.makeTarget($nodeList, schemaTargetParams);
					const linksToDelete = [];
					let connection;
					let source;
					let target;
					angular.forEach($scope.tab.schema.links, (link, k) => {

						source = target = "kn-node-";

						if ("id" in link.from) {
							source += link.from.id;
						} else {
							source += self.getNodeIdFromKid(link.from.kid);
						}

						if ("id" in link.to) {
							target += link.to.id;
						} else {
							target += self.getNodeIdFromKid(link.to.kid);
						}

						connection = jsplumbInstance.connect({
							scope: link.id,
							source,
							target,
							connector: link.style.type,
							cssClass: self.getLinkCSS(link),
							anchors: ["Continuous"]
						});
						if (connection) {
							connection.getOverlay("label")
								.setLabel(self.getLinkName(link));
							$scope.tab.schema.links[k]._connection = connection;
						} else {
							linksToDelete.push(k);
						}

						if (linksToDelete.length > 0) {
							let index = $scope.tab.schema.links.length - 1;
							while (index >= 0) {
								if (linksToDelete.indexOf(index) >= 0) {
									$scope.tab.schema.links.splice(index, 1);
									self.edit = true;
								}
								index -= 1;
							}
						}
					});
				});
				angular.forEach($scope.tab.schema.nodes, (node) => {
					self.addLinkIsa(node);
				});

			}
		};


		/********************************************/
		/*             JSPLUMB EVENTS               */
		/********************************************/

		$scope.$on("jsplumb.instance.created", (evt, instance) => {
			console.log(`${new Date().toISOString()} : jsplumb instance is created`);
			jsplumbInstance = instance;
			console.log("version", jsplumbInstance.version);
			jsplumbInstance.connectorClass = "kn-link-color-default kn-link-dash-0 kn-link-width-2";
			self.load();
		});

		$scope.$on("jsplumb.instance.connection", (evt, connection) => {
			console.log(`${new Date().toISOString()} : jsplumb connection has been created between ${connection.sourceId} and ${connection.targetId}`);
		});

		$scope.$on("jsplumb.instance.connection.click", (evt, connection) => {
			console.log(`${new Date().toISOString()} : jsplumb connection between ${connection.sourceId} and ${connection.targetId} has been clicked`);
		});

		$scope.$on("jsplumb.instance.connection.detached", (evt, connection) => {
			console.log(`${new Date().toISOString()} : jsplumb connection between ${connection.sourceId} and ${connection.targetId} has been detached`);
		});

		this.load = function () {
			$scope.tab.loading = true;
			$http.get("test5.json")
				.then((kjson) => {
					console.log(kjson);
					$scope.tab.schema.name = kjson.data.info.name;
					angular.forEach(kjson.data.nodes || {}, (node, objnum) => {
						if (!("objnum" in node) || /^K_NODE;/.test(objnum)) {
							node.objnum = objnum;
						}
						$scope.tab.schema.nodes.push(node);
					});
					angular.forEach(kjson.data.links || {}, (link, klink) => {
						if (!("link" in link) || /^KLINK;/.test(klink)) {
							link.link = klink;
						}
						$scope.tab.schema.links.push(link);
					});
					$scope.tab.loading = false;
					self.init();
				});
		};


	});
