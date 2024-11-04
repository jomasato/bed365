import { useState } from 'react';
import { PlusCircle, MinusCircle, AlertCircle, TrendingUp,Check,X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ArbitrageAnalyzer = () => {
  const MATCH_TYPES = {
    '1x2': { name: '1x2（勝ち引き分け負け）', outcomes: ['勝ち', '引分', '負け'] },
    'win_lose': { name: 'ホーム/アウェイ', outcomes: ['ホーム勝利', 'アウェイ勝利'] }
  };

  const [matchType, setMatchType] = useState('win_lose');
  const [bookmakers, setBookmakers] = useState([
    { id: 1, name: 'bet365', odds: [2.05, 1.80], isEditing: false },
    { id: 2, name: 'Pinnacle', odds: [2.10, 1.75], isEditing: false },
    { id: 3, name: 'William Hill', odds: [2.08, 1.78], isEditing: false }
  ]);

    // 編集モード切り替え
    const toggleEdit = (bookmakerIndex) => {
        const newBookmakers = bookmakers.map((bm, index) => ({
          ...bm,
          isEditing: index === bookmakerIndex ? !bm.isEditing : bm.isEditing
        }));
        setBookmakers(newBookmakers);
      };
    
      // 名前更新
      const updateBookmakerName = (bookmakerIndex, newName) => {
        const newBookmakers = [...bookmakers];
        newBookmakers[bookmakerIndex] = {
          ...newBookmakers[bookmakerIndex],
          name: newName,
          isEditing: false
        };
        setBookmakers(newBookmakers);
      };
    
      // キャンセル処理
      const cancelEdit = (bookmakerIndex) => {
        const newBookmakers = [...bookmakers];
        newBookmakers[bookmakerIndex].isEditing = false;
        setBookmakers(newBookmakers);
      };
    
  
  const [analysis, setAnalysis] = useState(null);

  // 試合形式変更時の処理
  const handleMatchTypeChange = (type) => {
    setMatchType(type);
    const newBookmakers = bookmakers.map(bm => ({
      ...bm,
      odds: type === 'win_lose' 
        ? [2.05, 1.80]
        : [2.05, 3.40, 1.80]
    }));
    setBookmakers(newBookmakers);
    setAnalysis(null);
  };

  // アービトラージ計算ロジック
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
    
    const baseInvestment = 100;
    const totalInvestment = baseInvestment / (1 - totalImpliedProb);
    const stakes = impliedProb.map(prob => (prob * totalInvestment).toFixed(2));
    
    setAnalysis({
      bestOdds,
      bestSites,
      stakes,
      totalInvestment: totalInvestment.toFixed(2),
      profitRate: (maxProfitRate * 100).toFixed(2),
      hasArbitrage: totalImpliedProb < 1
    });
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

        {/* データ入力テーブル */}
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

      {analysis && (
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">最適な賭け配分（投資額100円）</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">結果</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">配分額</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">使用サイト</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">オッズ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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
                  <h3 className="text-lg font-semibold mb-3">収益性分析</h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-700">総投資額: {analysis.totalInvestment}円</p>
                    <p className="text-gray-700">期待利益率: {analysis.profitRate}%</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">オッズ比較</h3>
                <LineChart
                  width={600}
                  height={300}
                  data={MATCH_TYPES[matchType].outcomes.map((outcome, i) => ({
                    name: outcome,
                    ...bookmakers.reduce((acc, bm) => ({
                      ...acc,
                      [bm.name]: bm.odds[i]
                    }), {})
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {bookmakers.map((bm, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={bm.name}
                      stroke={`hsl(${i * 360 / bookmakers.length}, 70%, 50%)`}
                    />
                  ))}
                </LineChart>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ArbitrageAnalyzer;