import React from 'react';
import p2r from 'path-to-regexp';
import { startCase } from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import styles from './styles';

import { watchList } from 'api';
import {
  activeItems,
  setLoading,
  setList,
  ensureActiveItems,
  fetchListData,
} from 'store';

import { withSsr } from 'utils';
import Item from 'components/Item';
import Spinner from 'components/Spinner';

import LineChart from '../../components/Chart';

@connect(
  (state, props) => ({
    loading: state.loading,
    activeItems: activeItems(state, props.match.params.page),
    itemsPerPage: state.itemsPerPage,
    lists: state.lists,
  }),
  (
    dispatch,
    {
      type,
      match: {
        params: { page },
      },
    },
  ) => ({
    setLoading: loading => dispatch(setLoading(loading)),
    setList: (listType, ids) => dispatch(setList(listType, ids)),
    fetchListData: () => dispatch(fetchListData(type, page)),
    ensureActiveItems: () => dispatch(ensureActiveItems(page)),
  }),
)
@withSsr(styles, false, ({ props }) => startCase(props.type))
export default class ItemList extends React.Component {
  static propTypes = {
    loading: PropTypes.bool.isRequired,
    activeItems: PropTypes.array.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    itemsPerPage: PropTypes.number.isRequired,
    lists: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    fetchListData: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    setLoading: PropTypes.func.isRequired,
    setList: PropTypes.func.isRequired,
    ensureActiveItems: PropTypes.func.isRequired,
  }

  state = {
    displayedPage: this.page,
    itemTransition: 'item',
    transition: 'slide-right',
  }

  get page() {
    return Number(this.props.match.params.page) || 1
  }

  get maxPage() {
    const { itemsPerPage, lists, type } = this.props
    return Math.ceil(lists[type].length / itemsPerPage)
  }

  get hasMore() {
    return this.page < this.maxPage
  }

  loadItems(to = this.page, from = -1) {
    this.props.setLoading(true)

    this.props.fetchListData().then(() => {
      if (this.page < 0 || this.page > this.maxPage) {
        this.props.history.replace(`/${this.props.type}`)
        return
      }

      const transition =
        from === -1 ? '' : to > from ? 'slide-left' : 'slide-right'

      this.setState(
        {
          displayedPage: -1,
          itemTransition: '',
          transition,
        },
        () =>
          setTimeout(
            () => {
              this.setState(
                {
                  displayedPage: to
                },
                () => {
                  this.props.setLoading(false)
                },
              )
            },
            transition ? 500 : 0,
          ),
      )
    })
  }

  isSameLocation(prev, curr) {
    return prev.pathname === curr.pathname && prev.search === curr.search
  }

  componentDidMount() {
    const { type } = this.props

    this.unwatchList = watchList(type, ids => {
      this.props.setList(type, ids);
      this.props.ensureActiveItems();
    });

    this.unwatchPage = this.props.history.listen(location => {
      const {
        params: { page: prevPage },
        path,
      } = this.props.match;
      if (
        this.isSameLocation(this.props.location, location) ||
        !p2r(path).exec(location.pathname)
      ) {
        return;
      }
      setTimeout(() =>
        this.loadItems(this.props.match.params.page, prevPage || 1),
      );
    })
  }

  componentWillUnmount() {
    this.unwatchList()
    this.unwatchPage()
  }

  render() {
    const { activeItems } = this.props;

    const { page, maxPage, hasMore } = this;
    const {
      displayedPage,
      itemTransition,
      transition,
    } = this.state;

    const { loading, type } = this.props;

    console.log('ItemList:activeItems', activeItems)

    return (
      <div className="news-view">
        <div className="news-list-nav">
          {page > 1 ? (
            <Link to={'/' + type + '/' + (page - 1)}>&lt; prev</Link>
          ) : (
              <a className="disabled">&lt; prev</a>
            )}
          <span>
            {page}/{maxPage}
          </span>
          {hasMore ? (
            <Link to={'/' + type + '/' + (page + 1)}>more &gt;</Link>
          ) : (
              <a className="disabled">more &gt;</a>
            )}
        </div>
        <CSSTransition
          in={displayedPage > 0}
          classNames={transition}
          timeout={transition ? 500 : 0}
          onEntered={() => {
            this.setState({
              itemTransition: 'item',
            })
          }}
        >
          <div className="news-list">
            {maxPage && !loading ? (
              <TransitionGroup component="ul">
                {activeItems.map(item => (
                  <CSSTransition
                    key={item.id}
                    classNames={itemTransition}
                    timeout={itemTransition ? 500 : 0}
                  >
                    <Item item={item} />
                  </CSSTransition>
                ))}
                <LineChart displayedItems={activeItems} />
              </TransitionGroup>
            ) : (
                <div className="loading">
                  <Spinner show={true} />
                </div>
              )}
          </div>
        </CSSTransition>
      </div>
    )
  }
}
