import React from 'react';
import PropTypes from 'prop-types';

var Tag = (props) => (
  React.createElement( 'button', { type: 'button', className: props.classNames.selectedTag, title: 'Click to remove tag', onClick: props.onDelete },
    React.createElement( 'span', { className: props.classNames.selectedTagName }, props.tag.name)
  )
)

const SIZER_STYLES = {
  position: 'absolute',
  width: 0,
  height: 0,
  visibility: 'hidden',
  overflow: 'scroll',
  whiteSpace: 'pre'
};

const STYLE_PROPS = [
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'letterSpacing'
];

class Input extends React.Component {
  constructor (props) {
    super(props);
    this.state = { inputWidth: null };
  }

  componentDidMount () {
    if (this.props.autoresize) {
      this.copyInputStyles();
      this.updateInputWidth();
    }
  }

  componentDidUpdate () {
    this.updateInputWidth();
  }

  componentWillReceiveProps (newProps) {
    if (this.input.value !== newProps.query) {
      this.input.value = newProps.query;
    }
  }

  copyInputStyles () {
    const inputStyle = window.getComputedStyle(this.input);

    STYLE_PROPS.forEach((prop) => {
      this.sizer.style[prop] = inputStyle[prop];
    });
  }

  updateInputWidth () {
    let inputWidth;

    if (this.props.autoresize) {
      // scrollWidth is designed to be fast not accurate.
      // +2 is completely arbitrary but does the job.
      inputWidth = Math.ceil(this.sizer.scrollWidth) + 2;
    }

    if (inputWidth !== this.state.inputWidth) {
      this.setState({ inputWidth });
    }
  }

  render () {
    const { id, query, placeholder, expanded, classNames, index } = this.props;

    return (
      React.createElement( 'div', { className: classNames.searchInput },
        React.createElement( 'input', {
          ref: (c) => { this.input = c; }, value: query, placeholder: placeholder, role: 'combobox', 'aria-autocomplete': 'list', 'aria-label': placeholder, 'aria-owns': id, 'aria-activedescendant': index > -1 ? `${id}-${index}` : null, 'aria-expanded': expanded, style: { width: this.state.inputWidth } }),
        React.createElement( 'div', { ref: (c) => { this.sizer = c; }, style: SIZER_STYLES }, query || placeholder)
      )
    )
  }
}

function escapeForRegExp (string) {
  return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')
}

function matchAny (string) {
  return new RegExp(escapeForRegExp(string), 'gi')
}

function matchPartial (string) {
  return new RegExp(`(?:^|\\s)${escapeForRegExp(string)}`, 'i')
}

function matchExact (string) {
  return new RegExp(`^${escapeForRegExp(string)}$`, 'i')
}

function markIt (name, query) {
  const regexp = matchAny(query);
  return name.replace(regexp, '<mark>$&</mark>')
}

const DefaultSuggestionComponent = ({ item, query }) => (
  React.createElement( 'span', { dangerouslySetInnerHTML: { __html: markIt(item.name, query) } })
);

class Suggestions extends React.Component {
  onMouseDown (item, e) {
    // focus is shifted on mouse down but calling preventDefault prevents this
    e.preventDefault();
    this.props.addTag(item);
  }

  render () {
    if (!this.props.expanded || !this.props.options.length) {
      return null
    }

    const SuggestionComponent = this.props.suggestionComponent || DefaultSuggestionComponent;

    const options = this.props.options.map((item, index) => {
      const key = `${this.props.id}-${index}`;
      const classNames = [];

      if (this.props.index === index) {
        classNames.push(this.props.classNames.suggestionActive);
      }

      if (item.disabled) {
        classNames.push(this.props.classNames.suggestionDisabled);
      }

      return (
        React.createElement( 'li', {
          id: key, key: key, role: 'option', className: classNames.join(' '), 'aria-disabled': item.disabled === true, onMouseDown: this.onMouseDown.bind(this, item) },
          React.createElement( SuggestionComponent, { item: item, query: this.props.query })
        )
      )
    });

    return (
      React.createElement( 'div', { className: this.props.classNames.suggestions },
        React.createElement( 'ul', { role: 'listbox', id: this.props.id }, options)
      )
    )
  }
}

const KEYS = {
  ENTER: 'Enter',
  TAB: 'Tab',
  BACKSPACE: 'Backspace',
  UP_ARROW: 'ArrowUp',
  DOWN_ARROW: 'ArrowDown'
};

const CLASS_NAMES = {
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
  if (this.state.query || this.state.index > -1) {
    e.preventDefault();
  }

  if (this.state.query.length >= this.props.minQueryLength) {
    // Check if the user typed in an existing suggestion.
    const match = this.state.options.findIndex((option) => {
      return matchExact(this.state.query).test(option.name)
    });

    const index = this.state.index === -1 ? match : this.state.index;

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
  const size = this.state.options.length - 1;
  this.setState({ index: this.state.index <= 0 ? size : this.state.index - 1 });
}

function pressDownKey (e) {
  e.preventDefault();

  // if last item, cycle to top
  const size = this.state.options.length - 1;
  this.setState({ index: this.state.index >= size ? 0 : this.state.index + 1 });
}

function pressBackspaceKey () {
  // when backspace key is pressed and query is blank, delete the last tag
  if (!this.state.query.length) {
    this.deleteTag(this.props.tags.length - 1);
  }
}

function filterSuggestions (query, suggestions) {
  const regexp = matchPartial(query);
  return suggestions.filter((item) => regexp.test(item.name))
}

class ReactTags extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      query: '',
      focused: false,
      options: [],
      index: -1,
      classNames: Object.assign({}, CLASS_NAMES, this.props.classNames)
    };
  }

  componentWillReceiveProps (newProps) {
    this.setState({
      classNames: Object.assign({}, CLASS_NAMES, newProps.classNames)
    });
  }

  onInput (e) {
    const query = e.target.value;

    if (this.props.onInput) {
      this.props.onInput(query);
    }

    if (query !== this.state.query) {
      const filtered = filterSuggestions(query, this.props.suggestions);
      const options = filtered.slice(0, this.props.maxSuggestionsLength);

      this.setState({ query, options });
    }
  }

  onKeyDown (e) {
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
  }

  onClick (e) {
    if (document.activeElement !== e.target) {
      this.input.input.focus();
    }
  }

  onBlur () {
    this.setState({ focused: false, index: -1 });

    if (this.props.onBlur) {
      this.props.onBlur();
    }
  }

  onFocus () {
    this.setState({ focused: true });

    if (this.props.onFocus) {
      this.props.onFocus();
    }
  }

  addTag (tag) {
    if (tag.disabled) {
      return
    }

    this.props.onAddition(tag);

    // reset the state
    this.setState({
      query: '',
      index: -1
    });
  }

  deleteTag (i) {
    this.props.onDelete(i);
    this.setState({ query: '' });
  }

  render () {
    const TagComponent = this.props.tagComponent || Tag;

    const tags = this.props.tags.map((tag, i) => (
      React.createElement( TagComponent, {
        key: i, tag: tag, classNames: this.state.classNames, onDelete: this.deleteTag.bind(this, i) })
    ));

    const expanded = this.state.focused && this.state.query.length >= this.props.minQueryLength;
    const classNames = [this.state.classNames.root];

    this.state.focused && classNames.push(this.state.classNames.rootFocused);

    return (
      React.createElement( 'div', { className: classNames.join(' '), onClick: this.onClick.bind(this) },
        React.createElement( 'div', {
          className: this.state.classNames.selected, 'aria-relevant': 'additions removals', 'aria-live': 'polite' },
          tags
        ),
        React.createElement( 'div', {
          className: this.state.classNames.search, onInputCapture: this.onInput.bind(this), onFocusCapture: this.onFocus.bind(this), onBlurCapture: this.onBlur.bind(this), onKeyDown: this.onKeyDown.bind(this) },
          React.createElement( Input, Object.assign({}, this.state, { id: this.props.id, ref: (c) => { this.input = c; }, autoresize: this.props.autoresize, expanded: expanded, placeholder: this.props.placeholder })),
          React.createElement( Suggestions, Object.assign({}, this.state, { id: this.props.id, ref: (c) => { this.suggestions = c; }, expanded: expanded, addTag: this.addTag.bind(this), suggestionComponent: this.props.suggestionComponent }))
        )
      )
    )
  }
}

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

export default ReactTags;
