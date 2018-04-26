'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var PropTypes = _interopDefault(require('prop-types'));

function Tag (props) { return (
  React.createElement( 'button', { type: 'button', className: props.classNames.selectedTag, title: 'Click to remove tag', onClick: props.onDelete },
    React.createElement( 'span', { className: props.classNames.selectedTagName }, props.tag.name)
  )
); }

var SIZER_STYLES = {
  position: 'absolute',
  width: 0,
  height: 0,
  visibility: 'hidden',
  overflow: 'scroll',
  whiteSpace: 'pre'
};

var STYLE_PROPS = [
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'letterSpacing'
];

var Input = (function (superclass) {
  function Input (props) {
    superclass.call(this, props);
    this.state = { inputWidth: null };
  }

  if ( superclass ) Input.__proto__ = superclass;
  Input.prototype = Object.create( superclass && superclass.prototype );
  Input.prototype.constructor = Input;

  Input.prototype.componentDidMount = function componentDidMount () {
    if (this.props.autoresize) {
      this.copyInputStyles();
      this.updateInputWidth();
    }
  };

  Input.prototype.componentDidUpdate = function componentDidUpdate () {
    this.updateInputWidth();
  };

  Input.prototype.componentWillReceiveProps = function componentWillReceiveProps (newProps) {
    if (this.input.value !== newProps.query) {
      this.input.value = newProps.query;
    }
  };

  Input.prototype.copyInputStyles = function copyInputStyles () {
    var this$1 = this;

    var inputStyle = window.getComputedStyle(this.input);

    STYLE_PROPS.forEach(function (prop) {
      this$1.sizer.style[prop] = inputStyle[prop];
    });
  };

  Input.prototype.updateInputWidth = function updateInputWidth () {
    var inputWidth;

    if (this.props.autoresize) {
      // scrollWidth is designed to be fast not accurate.
      // +2 is completely arbitrary but does the job.
      inputWidth = Math.ceil(this.sizer.scrollWidth) + 2;
    }

    if (inputWidth !== this.state.inputWidth) {
      this.setState({ inputWidth: inputWidth });
    }
  };

  Input.prototype.render = function render () {
    var this$1 = this;

    var ref = this.props;
    var id = ref.id;
    var query = ref.query;
    var placeholder = ref.placeholder;
    var expanded = ref.expanded;
    var classNames = ref.classNames;
    var index = ref.index;

    return (
      React.createElement( 'div', { className: classNames.searchInput },
        React.createElement( 'input', {
          ref: function (c) { this$1.input = c; }, value: query, placeholder: placeholder, role: 'combobox', 'aria-autocomplete': 'list', 'aria-label': placeholder, 'aria-owns': id, 'aria-activedescendant': index > -1 ? (id + "-" + index) : null, 'aria-expanded': expanded, style: { width: this.state.inputWidth } }),
        React.createElement( 'div', { ref: function (c) { this$1.sizer = c; }, style: SIZER_STYLES }, query || placeholder)
      )
    )
  };

  return Input;
}(React.Component));

function escapeForRegExp (string) {
  return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')
}

function matchAny (string) {
  return new RegExp(escapeForRegExp(string), 'gi')
}

function matchPartial (string) {
  return new RegExp(("(?:^|\\s)" + (escapeForRegExp(string))), 'i')
}

function matchExact (string) {
  return new RegExp(("^" + (escapeForRegExp(string)) + "$"), 'i')
}

function markIt (name, query) {
  var regexp = matchAny(query);
  return name.replace(regexp, '<mark>$&</mark>')
}

var DefaultSuggestionComponent = function (ref) {
  var item = ref.item;
  var query = ref.query;

  return (
  React.createElement( 'span', { dangerouslySetInnerHTML: { __html: markIt(item.name, query) } })
);
};

var Suggestions = (function (superclass) {
  function Suggestions () {
    superclass.apply(this, arguments);
  }

  if ( superclass ) Suggestions.__proto__ = superclass;
  Suggestions.prototype = Object.create( superclass && superclass.prototype );
  Suggestions.prototype.constructor = Suggestions;

  Suggestions.prototype.onMouseDown = function onMouseDown (item, e) {
    // focus is shifted on mouse down but calling preventDefault prevents this
    e.preventDefault();
    this.props.addTag(item);
  };

  Suggestions.prototype.render = function render () {
    var this$1 = this;

    if (!this.props.expanded || !this.props.options.length) {
      return null
    }

    var SuggestionComponent = this.props.suggestionComponent || DefaultSuggestionComponent;

    var options = this.props.options.map(function (item, index) {
      var key = (this$1.props.id) + "-" + index;
      var classNames = [];

      if (this$1.props.index === index) {
        classNames.push(this$1.props.classNames.suggestionActive);
      }

      if (item.disabled) {
        classNames.push(this$1.props.classNames.suggestionDisabled);
      }

      return (
        React.createElement( 'li', {
          id: key, key: key, role: 'option', className: classNames.join(' '), 'aria-disabled': item.disabled === true, onMouseDown: this$1.onMouseDown.bind(this$1, item) },
          React.createElement( SuggestionComponent, { item: item, query: this$1.props.query })
        )
      )
    });

    return (
      React.createElement( 'div', { className: this.props.classNames.suggestions },
        React.createElement( 'ul', { role: 'listbox', id: this.props.id }, options)
      )
    )
  };

  return Suggestions;
}(React.Component));

var KEYS = {
  ENTER: 'Enter',
  TAB: 'Tab',
  BACKSPACE: 'Backspace',
  UP_ARROW: 'ArrowUp',
  DOWN_ARROW: 'ArrowDown'
};

var CLASS_NAMES = {
  root: 'react-tags',
  rootFocused: 'is-focused',
  selected: 'react-tags__selected',
  selectedTag: 'react-tags__selected-tag',
  selectedTagName: 'react-tags__selected-tag-name',
  search: 'react-tags__search',
  searchInput: 'react-tags__search-input',
  suggestions: 'react-tags__suggestions',
  suggestionActive: 'is-active',
  suggestionDisabled: 'is-disabled'
};

function pressDelimiterKey (e) {
  var this$1 = this;

  if (this.state.query || this.state.index > -1) {
    e.preventDefault();
  }

  if (this.state.query.length >= this.props.minQueryLength) {
    // Check if the user typed in an existing suggestion.
    var match = this.state.options.findIndex(function (option) {
      return matchExact(this$1.state.query).test(option.name)
    });

    var index = this.state.index === -1 ? match : this.state.index;

    if (index > -1) {
      this.addTag(this.state.options[index]);
    } else if (this.props.allowNew) {
      this.addTag({ name: this.state.query });
    }
  }
}

function pressUpKey (e) {
  e.preventDefault();

  // if first item, cycle to the bottom
  var size = this.state.options.length - 1;
  this.setState({ index: this.state.index <= 0 ? size : this.state.index - 1 });
}

function pressDownKey (e) {
  e.preventDefault();

  // if last item, cycle to top
  var size = this.state.options.length - 1;
  this.setState({ index: this.state.index >= size ? 0 : this.state.index + 1 });
}

function pressBackspaceKey () {
  // when backspace key is pressed and query is blank, delete the last tag
  if (!this.state.query.length) {
    this.deleteTag(this.props.tags.length - 1);
  }
}

function filterSuggestions (query, suggestions) {
  var regexp = matchPartial(query);
  return suggestions.filter(function (item) { return regexp.test(item.name); })
}

var ReactTags = (function (superclass) {
  function ReactTags (props) {
    superclass.call(this, props);

    this.state = {
      query: '',
      focused: false,
      options: [],
      index: -1,
      classNames: Object.assign({}, CLASS_NAMES, this.props.classNames)
    };
  }

  if ( superclass ) ReactTags.__proto__ = superclass;
  ReactTags.prototype = Object.create( superclass && superclass.prototype );
  ReactTags.prototype.constructor = ReactTags;

  ReactTags.prototype.componentWillReceiveProps = function componentWillReceiveProps (newProps) {
    this.setState({
      classNames: Object.assign({}, CLASS_NAMES, newProps.classNames)
    });
  };

  ReactTags.prototype.onInput = function onInput (e) {
    var query = e.target.value;

    if (this.props.onInput) {
      this.props.onInput(query);
    }

    if (query !== this.state.query) {
      var filtered = filterSuggestions(query, this.props.suggestions);
      var options = filtered.slice(0, this.props.maxSuggestionsLength);

      this.setState({ query: query, options: options });
    }
  };

  ReactTags.prototype.onKeyDown = function onKeyDown (e) {
    // when one of the terminating keys is pressed, add current query to the tags
    if (this.props.delimiters.indexOf(e.key) > -1) {
      pressDelimiterKey.call(this, e);
    }

    // when backspace key is pressed and query is blank, delete the last tag
    if (e.key === KEYS.BACKSPACE && this.props.allowBackspace) {
      pressBackspaceKey.call(this, e);
    }

    if (e.key === KEYS.UP_ARROW) {
      pressUpKey.call(this, e);
    }

    if (e.key === KEYS.DOWN_ARROW) {
      pressDownKey.call(this, e);
    }
  };

  ReactTags.prototype.onClick = function onClick (e) {
    if (document.activeElement !== e.target) {
      this.input.input.focus();
    }
  };

  ReactTags.prototype.onBlur = function onBlur () {
    this.setState({ focused: false, index: -1 });

    if (this.props.onBlur) {
      this.props.onBlur();
    }
  };

  ReactTags.prototype.onFocus = function onFocus () {
    this.setState({ focused: true });

    if (this.props.onFocus) {
      this.props.onFocus();
    }
  };

  ReactTags.prototype.addTag = function addTag (tag) {
    if (tag.disabled) {
      return
    }

    this.props.onAddition(tag);

    // reset the state
    this.setState({
      query: '',
      index: -1
    });
  };

  ReactTags.prototype.deleteTag = function deleteTag (i) {
    this.props.onDelete(i);
    this.setState({ query: '' });
  };

  ReactTags.prototype.render = function render () {
    var this$1 = this;

    var TagComponent = this.props.tagComponent || Tag;

    var tags = this.props.tags.map(function (tag, i) { return (
      React.createElement( TagComponent, {
        key: i, tag: tag, classNames: this$1.state.classNames, onDelete: this$1.deleteTag.bind(this$1, i) })
    ); });

    var expanded = this.state.focused && this.state.query.length >= this.props.minQueryLength;
    var classNames = [this.state.classNames.root];

    this.state.focused && classNames.push(this.state.classNames.rootFocused);

    return (
      React.createElement( 'div', { className: classNames.join(' '), onClick: this.onClick.bind(this) },
        React.createElement( 'div', {
          className: this.state.classNames.selected, 'aria-relevant': 'additions removals', 'aria-live': 'polite' },
          tags
        ),
        React.createElement( 'div', {
          className: this.state.classNames.search, onInputCapture: this.onInput.bind(this), onFocusCapture: this.onFocus.bind(this), onBlurCapture: this.onBlur.bind(this), onKeyDown: this.onKeyDown.bind(this) },
          React.createElement( Input, Object.assign({}, this.state, { id: this.props.id, ref: function (c) { this$1.input = c; }, autoresize: this.props.autoresize, expanded: expanded, placeholder: this.props.placeholder })),
          React.createElement( Suggestions, Object.assign({}, this.state, { id: this.props.id, ref: function (c) { this$1.suggestions = c; }, expanded: expanded, addTag: this.addTag.bind(this), suggestionComponent: this.props.suggestionComponent }))
        )
      )
    )
  };

  return ReactTags;
}(React.Component));

ReactTags.defaultProps = {
  id: 'ReactTags',
  tags: [],
  placeholder: 'Add new tag',
  suggestions: [],
  autoresize: true,
  delimiters: [KEYS.TAB, KEYS.ENTER],
  minQueryLength: 2,
  maxSuggestionsLength: 6,
  allowNew: false,
  allowBackspace: true,
  tagComponent: null,
  suggestionComponent: null
};

ReactTags.propTypes = {
  id: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.object),
  placeholder: PropTypes.string,
  suggestions: PropTypes.arrayOf(PropTypes.object),
  autoresize: PropTypes.bool,
  delimiters: PropTypes.arrayOf(PropTypes.string),
  onDelete: PropTypes.func.isRequired,
  onAddition: PropTypes.func.isRequired,
  onInput: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  minQueryLength: PropTypes.number,
  maxSuggestionsLength: PropTypes.number,
  classNames: PropTypes.object,
  allowNew: PropTypes.bool,
  allowBackspace: PropTypes.bool,
  tagComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.element
  ]),
  suggestionComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.element
  ])
};

module.exports = ReactTags;
