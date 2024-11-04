import { useState } from 'react';
import { PlusCircle, MinusCircle, AlertCircle, TrendingUp, Check, X } from 'lucide-react';

const ArbitrageAnalyzer = () => {
  const MATCH_TYPES = {
    '1x2': { name: '1x2（勝ち引き分け負け）', outcomes: ['勝ち', '引分', '負け'] },
    'win_lose': { name: 'ホーム/アウェイ', outcomes: ['ホーム勝利', 'アウェイ勝利'] }
  };

  const [matchType, setMatchType] = useState('win_lose');
  const [bookmakers, setBookmakers] = useState([
    { id: 1, name: 'stake', odds: [2.05, 1.80], isEditing: false },
    { id: 2, name: 'Pinnacle', odds: [2.10, 1.75], isEditing: false },
    { id: 3, name: 'William Hill', odds: [2.08, 1.78], isEditing: false }
  ]);
  const [simulationAmount, setSimulationAmount] = useState(100);
  const [analysis, setAnalysis] = useState(null);

  const toggleEdit = (bookmakerIndex) => {
    const newBookmakers = bookmakers.map((bm, index) => ({
      ...bm,
      isEditing: index === bookmakerIndex ? !bm.isEditing : bm.isEditing
    }));
    setBookmakers(newBookmakers);
  };

  const updateBookmakerName = (bookmakerIndex, newName) => {
    const newBookmakers = [...bookmakers];
    newBookmakers[bookmakerIndex] = {
      ...newBookmakers[bookmakerIndex],
      name: newName,
      isEditing: false
    };
    setBookmakers(newBookmakers);
  };

  const cancelEdit = (bookmakerIndex) => {
    const newBookmakers = [...bookmakers];
    newBookmakers[bookmakerIndex].isEditing = false;
    setBookmakers(newBookmakers);
  };

  const handleMatchTypeChange = (type) => {
    setMatchType(type);
    const newBookmakers = bookmakers.map(bm => ({
      ...bm,
      odds: type === 'win_lose' ? [2.05, 1.80] : [2.05, 3.40, 1.80]
    }));
    setBookmakers(newBookmakers);
    setAnalysis(null);
  };

  const calculatePayoutRate = (odds) => {
    const impliedProbs = odds.map(odd => 1/odd);
    const totalImpliedProb = impliedProbs.reduce((a, b) => a + b, 0);
    return ((1 / totalImpliedProb) * 100).toFixed(2);
  };

  const calculateArbitrage = () => {
    const odds = bookmakers.map(bm => bm.odds);
    const bestOdds = [];
    const bestSites = [];
    
    for (let i = 0; i < odds[0].length; i++) {
      let maxOdd = Math.max(...odds.map(row => row[i]));
      let maxSiteIndex = odds.findIndex(row => row[i] === maxOdd);
      bestOdds.push(maxOdd);
      bestSites.push(bookmakers[maxSiteIndex].name);
    }
    
    const impliedProb = bestOdds.map(odd => 1/odd);
    const totalImpliedProb = impliedProb.reduce((a, b) => a + b, 0);
    const maxProfitRate = 1 - totalImpliedProb;
    
    const totalInvestment = simulationAmount / (1 - totalImpliedProb);
    const stakes = impliedProb.map(prob => (prob * totalInvestment).toFixed(2));
    const expectedReturn = (totalInvestment * maxProfitRate).toFixed(2);
    
    // ブックメーカーごとの配当率を計算
    const bookmakerPayoutRates = bookmakers.map(bm => ({
      name: bm.name,
      payoutRate: calculatePayoutRate(bm.odds)
    }));
    
    setAnalysis({
      bestOdds,
      bestSites,
      stakes,
      totalInvestment: totalInvestment.toFixed(2),
      expectedReturn,
      profitRate: (maxProfitRate * 100).toFixed(2),
      hasArbitrage: totalImpliedProb < 1,
      bookmakerPayoutRates  // この行を追加
    });
  };

  const renderAnalysisResults = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">分析結果</h2>
      {!analysis.hasArbitrage ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <p className="ml-3 text-yellow-700">
              裁定取引の機会は見つかりませんでした
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">投資シミュレーション</h3>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="number"
                value={simulationAmount}
                onChange={(e) => {
                  setSimulationAmount(Number(e.target.value));
                  calculateArbitrage();
                }}
                className="w-32 p-2 border rounded"
                min="1"
                step="100"
              />
              <span className="text-gray-600">円での投資シミュレーション</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">必要総投資額:</span>
                <span className="ml-2 font-semibold">{analysis.totalInvestment}円</span>
              </div>
              <div>
                <span className="text-gray-600">期待収益:</span>
                <span className="ml-2 font-semibold">{analysis.expectedReturn}円</span>
              </div>
              <div>
                <span className="text-gray-600">利益率:</span>
                <span className="ml-2 font-semibold">{analysis.profitRate}%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">賭け金配分</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">結果</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">配分額</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">使用サイト</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">オッズ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {MATCH_TYPES[matchType].outcomes.map((outcome, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{outcome}</td>
                    <td className="px-4 py-2">{analysis.stakes[i]}円</td>
                    <td className="px-4 py-2">{analysis.bestSites[i]}</td>
                    <td className="px-4 py-2">{analysis.bestOdds[i].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">ブックメーカー別配当率</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {analysis.bookmakerPayoutRates.map((bm, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium">{bm.name}</div>
                  <div className="text-lg font-semibold">
                    {bm.payoutRate}%
                    <span className="text-sm text-gray-500 ml-1">配当率</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const updateOdds = (bookmakerIndex, outcomeIndex, value) => {
    const newBookmakers = [...bookmakers];
    newBookmakers[bookmakerIndex].odds[outcomeIndex] = parseFloat(value) || 0;
    setBookmakers(newBookmakers);
  };

  const addBookmaker = () => {
    const defaultOdds = matchType === 'win_lose' ? [2.05, 1.80] : [2.05, 3.40, 1.80];
    setBookmakers([...bookmakers, {
      id: bookmakers.length + 1,
      name: `ブックメーカー${bookmakers.length + 1}`,
      odds: defaultOdds,
      isEditing: false
    }]);
  };

  const removeBookmaker = (index) => {
    setBookmakers(bookmakers.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">アービトラージ分析ツール</h2>
          <div className="flex gap-4">
            <select
              value={matchType}
              onChange={(e) => handleMatchTypeChange(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              {Object.entries(MATCH_TYPES).map(([value, { name }]) => (
                <option key={value} value={value}>{name}</option>
              ))}
            </select>
            <button
              onClick={calculateArbitrage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              分析実行
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  ブックメーカー
                </th>
                {MATCH_TYPES[matchType].outcomes.map((outcome, i) => (
                  <th key={i} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {outcome}
                  </th>
                ))}
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookmakers.map((bm, bmIndex) => (
                <tr key={bm.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bm.isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          defaultValue={bm.name}
                          className="w-full p-1 border rounded text-gray-900"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateBookmakerName(bmIndex, e.target.value);
                            } else if (e.key === 'Escape') {
                              cancelEdit(bmIndex);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => updateBookmakerName(bmIndex, document.querySelector(`tr:nth-child(${bmIndex + 1}) input[type="text"]`).value)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => cancelEdit(bmIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-medium">{bm.name}</span>
                        <button
                          onClick={() => toggleEdit(bmIndex)}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                          編集
                        </button>
                      </div>
                    )}
                  </td>
                  {bm.odds.map((odd, oddIndex) => (
                    <td key={oddIndex} className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={odd}
                        onChange={(e) => updateOdds(bmIndex, oddIndex, e.target.value)}
                        className="w-20 p-1 border rounded text-center"
                      />
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => removeBookmaker(bmIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <MinusCircle className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button
          onClick={addBookmaker}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-700 px-4 py-2 border border-blue-600 rounded-md"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          ブックメーカー追加
        </button>
      </div>

      {analysis && renderAnalysisResults()}
    </div>
  );
};

export default ArbitrageAnalyzer;