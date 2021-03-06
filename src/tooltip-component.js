const d3 = require('d3');

var tooltipComponent = function(tooltipNode) {

    var root = d3.select(tooltipNode)
        .style('position', 'absolute')
        .style('pointer-events', 'none');

    var setText = function(html) {
        root.html(html);
        return this;
    };
    var position = function(x, y) {
        root.style('left', x + 'px')
            .style('top', y + 'px');
        return this;
    };
    var show = function() {
        root.style('display', 'block');
        return this;
    };
    var hide = function() {
        root.style('display', 'none');
        return this;
    };

    return {
        setText: setText,
        setPosition: position,
        show: show,
        hide: hide
    };
};

module.exports = tooltipComponent;