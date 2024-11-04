import { useState } from 'react';
import { PlusCircle, MinusCircle, AlertCircle, TrendingUp, Check, X } from 'lucide-react';

// カスタムアラートコンポーネント
const CustomAlert = ({ children, variant = 'warning' }) => {
  const bgColor = variant === 'warning' ? 'bg-yellow-50' : 'bg-red-50';
  const borderColor = variant === 'warning' ? 'border-yellow-400' : 'border-red-400';
  const textColor = variant === 'warning' ? 'text-yellow-700' : 'text-red-700';

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-4 my-4`}>
      <div className="flex">
        <AlertCircle className={`h-5 w-5 ${textColor}`} />
        <div className={`ml-3 ${textColor}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

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
  const [actualInvestment, setActualInvestment] = useState(100);
  const [analysis, setAnalysis] = useState(null);

  // Validation helper functions
  const validateInvestmentAmount = (amount) => {
    if (amount <= 0) return '投資額は0より大きい値を入力してください';
    if (amount > 10000000) return '投資額が上限を超えています（上限：1000万円）';
    return null;
  };

  const calculateArbitrage = () => {
    const odds = bookmakers.map(bm => bm.odds);
    const bestOdds = [];
    const bestSites = [];
    
    // Find best odds for each outcome
    for (let i = 0; i < odds[0].length; i++) {
      let maxOdd = Math.max(...odds.map(row => row[i]));
      let maxSiteIndex = odds.findIndex(row => row[i] === maxOdd);
      bestOdds.push(maxOdd);
      bestSites.push(bookmakers[maxSiteIndex].name);
    }
    
    // Calculate implied probabilities and total probability
    const impliedProb = bestOdds.map(odd => 1/odd);
    const totalImpliedProb = impliedProb.reduce((a, b) => a + b, 0);
    
    // Calculate minimum required investment and profit rate
    const profitRate = ((1 - totalImpliedProb) * 100).toFixed(2);
    const minRequiredInvestment = (100 / (1 - totalImpliedProb)).toFixed(2);
    
    // Calculate stakes and expected profit based on actual investment
    const actualTotal = parseFloat(actualInvestment);
    const stakes = impliedProb.map(prob => 
      (prob * actualTotal / totalImpliedProb).toFixed(2)
    );
    
    const expectedProfit = (actualTotal * (1 - totalImpliedProb) / totalImpliedProb).toFixed(2);
    
    // Calculate payout rates for each bookmaker
    const bookmakerPayoutRates = bookmakers.map(bm => ({
      name: bm.name,
      payoutRate: ((1 / bm.odds.reduce((a, b) => a + 1/b, 0)) * 100).toFixed(2)
    }));
    
    setAnalysis({
      bestOdds,
      bestSites,
      stakes,
      minRequiredInvestment,
      actualInvestment: actualTotal.toFixed(2),
      expectedProfit,
      profitRate,
      hasArbitrage: totalImpliedProb < 1,
      bookmakerPayoutRates,
      isInvestmentValid: parseFloat(actualInvestment) >= parseFloat(minRequiredInvestment)
    });
  };

  const renderAnalysisResults = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">分析結果</h2>
      {!analysis.hasArbitrage ? (
        <CustomAlert>
          裁定取引の機会は見つかりませんでした
        </CustomAlert>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">投資分析</h3>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="number"
                value={actualInvestment}
                onChange={(e) => {
                  setActualInvestment(Number(e.target.value));
                  calculateArbitrage();
                }}
                className="w-32 p-2 border rounded"
                min="1"
                max="10000000"
                step="100"
              />
              <span className="text-gray-600">円の実際の投資額</span>
            </div>

            {!analysis.isInvestmentValid && (
              <CustomAlert>
                裁定取引を成立させるには、最低{analysis.minRequiredInvestment}円の投資が必要です
              </CustomAlert>
            )}

            <div className="space-y-2 bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700">必要最小投資額: {analysis.minRequiredInvestment}円</p>
              <p className="text-gray-700">実際の投資額: {analysis.actualInvestment}円</p>
              <p className="text-gray-700">期待利益率: {analysis.profitRate}%</p>
              <p className="text-gray-700">期待利益額: {analysis.expectedProfit}円</p>
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
                      min="1.01"
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
                    <MinusCircle className="h-4 w-4" />
                  </button>
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