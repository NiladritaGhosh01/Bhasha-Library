import React from 'react';

export default function AuthorDashboard({ stories, onSelectStory, onDeleteStory, onNewStory, t, langMode }) {
  const totalLikes = stories.reduce((acc, s) => acc + (s.likes || 0), 0);

  return (
    <div className="dashboard-surface">
      {/* Minimal Header */}
      <div className="dashboard-top-card">
        <div className="creator-details">
          <div className="creator-avatar">NG</div>
          <div>
            <h2 className="creator-name">Niladrita Ghosh</h2>
            <p className="creator-role">{t.dashboard.tagline}</p>
          </div>
        </div>

        <button className="minimal-cta-btn" onClick={onNewStory}>
          + {t.dashboard.newStory}
        </button>
      </div>

      {/* Sleek Metrics Grid */}
      <div className="minimal-metrics-row">
        <div className="minimal-stat-card">
          <span className="stat-num">{stories.length}</span>
          <span className="stat-desc">{t.dashboard.statStories}</span>
        </div>

        <div className="minimal-stat-card">
          <span className="stat-num">12.4k</span>
          <span className="stat-desc">{t.dashboard.statReads}</span>
        </div>

        <div className="minimal-stat-card">
          <span className="stat-num">{totalLikes}</span>
          <span className="stat-desc">{t.dashboard.statLikes}</span>
        </div>

        <div className="minimal-stat-card">
          <span className="stat-num">96%</span>
          <span className="stat-desc">{t.dashboard.statRetention}</span>
        </div>
      </div>

      {/* Minimal Language Breakdown */}
      <div className="minimal-analytics-card">
        <h4>{t.dashboard.analyticsTitle}</h4>
        <div className="pref-row">
          <div className="pref-label">
            <span>{t.dashboard.dualPref}</span>
            <span className="pref-val">68%</span>
          </div>
          <div className="pref-track">
            <div className="pref-bar" style={{ width: '68%' }}></div>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="minimal-catalog-card">
        <h4 className="catalog-header">{t.dashboard.catalogTitle}</h4>
        <div className="catalog-table-wrap">
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t.dashboard.colTitle}</th>
                <th>{t.dashboard.colGenre}</th>
                <th>{t.dashboard.colLikes}</th>
                <th>{t.dashboard.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((story) => (
                <tr key={story.id}>
                  <td className="story-title-cell">
                    <span className="cell-primary">
                      {langMode === 'bn' ? (story.title?.bn || story.title?.en) : (story.title?.en || story.title)}
                    </span>
                  </td>
                  <td>
                    <span className="minimal-tag">
                      {langMode === 'bn' ? (story.genreBn || story.genre) : (story.genre || 'Story')}
                    </span>
                  </td>
                  <td>♥ {story.likes || 0}</td>
                  <td className="cell-actions">
                    <button className="table-action-link" onClick={() => onSelectStory(story)}>
                      {t.dashboard.read}
                    </button>
                    <button className="table-delete-link" onClick={() => onDeleteStory(story.id)}>
                      {t.dashboard.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
