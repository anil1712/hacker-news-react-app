import React from 'react';
import Chart from 'react-google-charts';
import { isVoted, itemExist, getVotedScore } from '../../utils';

export default class LineChart extends React.Component {
  render() {
    const { displayedItems } = this.props;

    const data = [
      ["ID", "Votes"]
    ];

    console.log('LineChart:displayedItems', displayedItems)
    displayedItems.forEach(item => {
      console.log('LineChart:item', item);
      if (!itemExist(item)) {
        const _voted = isVoted(item);
        const _score = parseInt(item.score);
        data.push([
          item.id + '',
          _voted ? getVotedScore(item) : _score
        ]);
      }
    });

    const options = {
      vAxis: {
        title: "Votes"
      },
      hAxis: {
        title: "ID"
      },
      legend: {
        position: 'none'
      }
    };

    return displayedItems.length <= 1 ? null : (
      <Chart
        chartType="LineChart"
        width="100%"
        height="400px"
        data={data}
        options={options}
      />
    );
  }
}
