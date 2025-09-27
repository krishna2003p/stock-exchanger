// bot-page.js (or your main page)
import React, { useEffect, useState } from 'react';
import { apiCall } from '@/lib/api.js';
import BotList from './bot-list';
import BotConfiguration from './bot-configuration';

export default function BotPage() {
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [botPasswordChanged, setBotPasswordChanged] = useState(false);

  useEffect(() => {
    apiCall('/api/getTradingBots')
      .then(res => {
        const botsArray = Array.isArray(res.data) ? res.data : [res.data];
      setBots(botsArray);})
      .finally(() => setLoading(false));
  }, [botPasswordChanged]);

  console.log('Bots:', bots);
  const selectedBot = bots.find(bot => bot.id === selectedBotId);
console.log('Selected Bot:', selectedBot);
  return (
    <div>
    {!selectedBot &&
      <BotList
        bots={bots}
        onSelectBot={botId => setSelectedBotId(botId)} // Lifts selection up
        loading={loading}
        error={null}
        setBotPasswordChanged={setBotPasswordChanged}
      />
    }
      {selectedBot &&
        <BotConfiguration
          botDetails={selectedBot}
        />
      }
    </div>
  );
}
