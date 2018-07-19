const utils = require('./component-utils'),
      tooltipComponent = require('./tooltip-component'),
      d3 = require('d3');

/**
 * 
 * FIXME: still a different representation with d3 v3
 * FIXME: fix events managment
 */

var radvizComponent = function() {
    var config = {
        el: null,
        size: 400,
        margin: 50,
        colorScale: d3.scaleOrdinal().range(['skyblue', 'orange', 'lime']),
        colorAccessor: null,
        dimensions: [],
        drawLinks: true,
        zoomFactor: 1,
        dotRadius: 6,
        useRepulsion: false,
        useTooltip: true,
        tooltipFormatter: function(d) {
            return d;
        }
    };

    var events = d3.dispatch('panelEnter', 'panelLeave', 'dotEnter', 'dotLeave');

    var simulation = d3.forceSimulation()
        .force("charge", d3.forceManyBody().strength(-60).distanceMax(0))
        .force("link", d3.forceLink().id(function(d) { return d.index }).strength(function(d) { return d.value }))
        .force("center", d3.forceCenter(config.size / 2, config.size / 2))
        .velocityDecay(0.5);

    var render = function(data) {
        data = addNormalizedValues(data);
        var normalizeSuffix = '_normalized';
        var dimensionNamesNormalized = config.dimensions.map(function(d) {
            return d + normalizeSuffix;
        });
        var thetaScale = d3.scaleLinear().domain([0, dimensionNamesNormalized.length]).range([0, Math.PI * 2]);

        var chartRadius = config.size / 2 - config.margin;
        var nodeCount = data.length;
        var panelSize = config.size - config.margin * 2;

        var dimensionNodes = config.dimensions.map(function(d, i) {
            var angle = thetaScale(i);
            var x = chartRadius + Math.cos(angle) * chartRadius * config.zoomFactor;
            var y = chartRadius + Math.sin(angle) * chartRadius * config.zoomFactor;
            return {
                index: nodeCount + i,
                x: x,
                y: y,
                fx: x,
                fy: y,
                name: d
            };
        });

        var linksData = [];
        data.forEach(function(d, i) {
            dimensionNamesNormalized.forEach(function(dB, iB) {
                linksData.push({
                    source: i,
                    target: nodeCount + iB,
                    value: d[dB]
                });
            });
        });

        simulation.nodes(data.concat(dimensionNodes))
            .force("link").links(linksData)

        // Basic structure
        const svg = d3.select(config.el)
            .append('svg')
            .attr("width", config.size)
            .attr("height", config.size);

        svg.append('rect')
            .classed('bg', true)
            .attr("width", config.size)
            .attr("height", config.size);

        var root = svg.append('g')
            .attr("transform", 'translate(' + [config.margin, config.margin] + ')');

        var panel = root.append('circle')
            .classed('panel', true)
            .attr("r", chartRadius)
            .attr("cx", chartRadius)
            .attr("cy", chartRadius);

        if(config.useRepulsion) {
            root.on('mouseenter', function(d) {
                simulation.alpha(0.5).force('charge').distanceMax(80);
                //events.panelEnter();
            });
            root.on('mouseleave', function(d) {
                simulation.alpha(0.5).force('charge').distanceMax(0);
                //events.panelLeave();
            });
        }

        // Links
        if(config.drawLinks) {
            var links = root.selectAll('.link')
                .data(linksData)
                .enter().append('line')
                .classed('link', true);
        }

        // Nodes
        var nodes = root.selectAll('circle.dot')
            .data(data)
            .enter().append('circle')
            .classed('dot', true)
            .attr("r", config.dotRadius)
            .attr("fill", function(d) {
                    return config.colorScale(config.colorAccessor(d));
                }
            )
            .on('mouseenter', function(d) {
                if(config.useTooltip) {
                    var mouse = d3.mouse(config.el);
                    tooltip.setText(config.tooltipFormatter(d)).setPosition(mouse[0], mouse[1]).show();
                }
                //events.dotEnter(d);
                this.classList.add('active');
            })
            .on('mouseout', function(d) {
                if(config.useTooltip) {
                    tooltip.hide();
                }
                //events.dotLeave(d);
                this.classList.remove('active');
            });

        // Labels
        var labelNodes = root.selectAll('circle.label-node')
            .data(dimensionNodes)
            .enter().append('circle')
            .classed('label-node', true)
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 4);

        var labels = root.selectAll('text.label')
            .data(dimensionNodes)
            .enter().append('text')
            .classed('label', true)
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('text-anchor', function(d) {
                    if(d.x > (panelSize * 0.4) && d.x < (panelSize * 0.6)) {
                        return 'middle';
                    } else {
                        return(d.x > panelSize / 2) ? 'start' : 'end';
                    }
                })
            .attr('dominant-baseline', function(d) { return(d.y > panelSize * 0.6) ? 'hanging' : 'auto'; })
            .attr('dx', function(d) { return(d.x > panelSize / 2) ? '6px' : '-6px'; })
            .attr('dy', function(d) { return(d.y > panelSize * 0.6) ? '6px' : '-6px'; })
            .text(function(d) { return d.name; });

        // Update force
        simulation.on('tick', function() {
            if(config.drawLinks) {
                links.attr({
                    x1: function(d) {
                        return d.source.x;
                    },
                    y1: function(d) {
                        return d.source.y;
                    },
                    x2: function(d) {
                        return d.target.x;
                    },
                    y2: function(d) {
                        return d.target.y;
                    }
                });
            }

            nodes.attr("cx", function(d) {
                    return d.x;
                })
                .attr("cy", function(d) {
                    return d.y;
                });
        });

        var tooltipContainer = d3.select(config.el)
            .append('div')
            .attr("id", 'radviz-tooltip');

        var tooltip = tooltipComponent(tooltipContainer.node());

        return this;
    };

    var setConfig = function(_config) {
        config = utils.mergeAll(config, _config);
        return this;
    };

    var addNormalizedValues = function(data) {
        data.forEach(function(d) {
            config.dimensions.forEach(function(dimension) {
                d[dimension] = +d[dimension];
            });
        });

        var normalizationScales = {};
        config.dimensions.forEach(function(dimension) {
            normalizationScales[dimension] = d3.scaleLinear().domain(d3.extent(data.map(function(d, i) {
                return d[dimension];
            }))).range([0, 1]);
        });

        data.forEach(function(d) {
            config.dimensions.forEach(function(dimension) {
                d[dimension + '_normalized'] = normalizationScales[dimension](d[dimension]);
            });
        });

        return data;
    };

    var exports = {
        config: setConfig,
        render: render
    };

    utils.rebind(exports, events, 'on');

    return exports;
};

module.exports = radvizComponent;