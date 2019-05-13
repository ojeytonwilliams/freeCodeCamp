import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import Media from 'react-responsive';
import FCCSearch from 'react-freecodecamp-search';

import MenuButton from './components/MenuButton';
import MenuLinks from './components/MenuLinks';
import NavLogo from './components/NavLogo';
import { Link } from '../helpers';

import './header.css';

import {
  toggleDisplayMenu,
  displayMenuSelector
} from '../layouts/components/guide/redux';

const mapStateToProps = createSelector(
  displayMenuSelector,
  displayMenu => ({
    displayMenu
  })
);

const mapDispatchToProps = dispatch =>
  bindActionCreators({ toggleDisplayMenu }, dispatch);

const propTypes = {
  disableMenuButtonBehavior: PropTypes.bool,
  disableSettings: PropTypes.bool,
  displayMenu: PropTypes.bool,
  mediaBreakpoint: PropTypes.string.isRequired,
  toggleDisplayMenu: PropTypes.func.isRequired
};

class Header extends Component {
  constructor(props) {
    super(props);
    this.menuButtonRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside = event => {
    if (
      !this.props.disableMenuButtonBehavior &&
      this.props.displayMenu &&
      this.menuButtonRef.current &&
      !this.menuButtonRef.current.contains(event.target)
    ) {
      this.props.toggleDisplayMenu();
    }
  };

  handleMediaChange = matches => {
    if (!matches && this.props.displayMenu) {
      this.props.toggleDisplayMenu();
    }
  };

  render() {
    const {
      disableMenuButtonBehavior,
      disableSettings,
      displayMenu,
      mediaBreakpoint,
      toggleDisplayMenu
    } = this.props;
    return (
      <header>
        <nav id='top-nav'>
          <Link className='home-link' to='/'>
            <NavLogo />
          </Link>
          {disableSettings ? null : <FCCSearch />}
          <Media maxWidth={mediaBreakpoint} onChange={this.handleMediaChange}>
            <MenuButton
              displayMenu={displayMenu}
              menuButtonRef={this.menuButtonRef}
              toggleDisplayMenu={toggleDisplayMenu}
            />
            {displayMenu && !disableMenuButtonBehavior && (
              <MenuLinks disableSettings={disableSettings} />
            )}
          </Media>
          <Media minWidth={mediaBreakpoint + 1}>
            <MenuLinks disableSettings={disableSettings} />
          </Media>
        </nav>
      </header>
    );
  }
}

Header.propTypes = propTypes;
Header.defaultProps = {
  mediaBreakpoint: 734
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);
