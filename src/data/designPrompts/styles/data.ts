import type { RawDesignStyle } from '../types';

export const dataStyles: RawDesignStyle[] = [
  {
      id: "dashboard",
      name: "现代仪表盘",
      category: "数据分析/仪表盘",
      accent: "#3b82f6",
      description: "B 端现代数据面板，Bento 网格布局，清晰的信息层级与微交互",
      previewHtml: `<div style="font-family: sans-serif; background: #f8fafc; padding: 14px; height: 100%; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: bold; color: #0f172a;">Business Panel</span>
      <span style="font-size: 10px; background: #e2e8f0; color: #475569; padding: 2px 7px; border-radius: 4px; font-weight: bold;">LIVE</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 11px; color: #64748b;">Daily Revenue</span>
        <span style="font-size: 18px; font-weight: 800; color: #2563eb;">$12.4K</span>
      </div>
      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 4px;">
        <span style="font-size: 11px; color: #64748b;">Conversion</span>
        <span style="font-size: 18px; font-weight: 800; color: #10b981;">3.42%</span>
      </div>
    </div>
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto;">
      <span style="font-size: 11px; color: #64748b;">Active Users</span>
      <div style="display: flex; gap: 3px; align-items: flex-end; height: 22px;">
        <div style="width: 4px; height: 10px; background: #2563eb; border-radius: 1px;"></div>
        <div style="width: 4px; height: 16px; background: #2563eb; border-radius: 1px;"></div>
        <div style="width: 4px; height: 8px; background: #2563eb; border-radius: 1px;"></div>
        <div style="width: 4px; height: 18px; background: #2563eb; border-radius: 1px;"></div>
        <div style="width: 4px; height: 22px; background: #2563eb; border-radius: 1px;"></div>
      </div>
    </div>
  </div>`,
      style: `【视觉主题】现代B端商业数据仪表盘（Data Dashboard）
  【色彩系统】
   - 基础底色：浅灰全局背景（如 #f8fafc）配以纯白数据卡片，营造呼吸感。
   - 文本颜色：信息层级分明，指标标题用次级灰（#64748b），核心数值用纯黑（#0f172a）。
   - 强调色：强语义色彩（绿 #10b981 代表上升，红 #ef4444 代表下降，蓝 #3b82f6 代表强调）。严禁滥用彩虹色。
  【排版规则】
   - 字体：极简无衬线体。数字必须使用等宽数字（font-variant-numeric: tabular-nums）以保证垂直对齐。
   - KPI展示：核心指标采用超大字号加粗，旁边必须配有带背景色的微小趋势标签（如 ↑ 12%）。
  【组件特征】
   - 卡片容器：利用 CSS Grid 或 Bento 网格系统，将图表与数据切割在带圆角（12px）和细腻阴影（shadow-sm/border）的白色卡片中。
   - 微型图表：用纯 CSS 或 HTML 元素绘制进度条、状态指示灯或极简的趋势柱状块，拒绝复杂的空白图表占位。
  【布局原则】"少即是多"（Less is more）。顶部展示核心数据卡片，下方展示详细图表或表格区域，整体高度对齐，减少用户的认知负荷。`,
    },
  {
      id: "data-command-center",
      previewHtml: `<div style="font-family: Consolas, Monaco, monospace; background: #06111f; color: #e5f2ff; padding: 16px; height: 100%; border: 1px solid #06b6d4; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(6,182,212,0.35); padding-bottom: 8px; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
        <span style="font-size: 11px; font-weight: bold; color: #06b6d4;">CORE DATACENTER</span>
      </div>
      <span style="font-size: 10px; color: rgba(229,242,255,0.6);">SYS_OK</span>
    </div>
    <div style="display: flex; gap: 8px; margin-bottom: auto;">
      <div style="flex: 1.2; background: #0f1b2d; padding: 10px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.2);">
        <div style="font-size: 10px; color: #8aa4bf;">CPU USAGE</div>
        <div style="font-size: 20px; font-weight: bold; color: #06b6d4; margin-top: 3px;">42.8%</div>
        <div style="display: flex; gap: 3px; align-items: flex-end; height: 16px; margin-top: 6px;">
          <div style="height: 6px; flex: 1; background: #06b6d4; opacity: 0.3;"></div>
          <div style="height: 9px; flex: 1; background: #06b6d4; opacity: 0.5;"></div>
          <div style="height: 7px; flex: 1; background: #06b6d4; opacity: 0.4;"></div>
          <div style="height: 12px; flex: 1; background: #06b6d4; opacity: 0.8;"></div>
          <div style="height: 14px; flex: 1; background: #06b6d4;"></div>
        </div>
      </div>
      <div style="flex: 0.8; background: #0f1b2d; padding: 10px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.2); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-size: 10px; color: #8aa4bf;">TASKS</div>
          <div style="font-size: 16px; font-weight: bold; color: #22c55e; margin-top: 3px;">1,248</div>
        </div>
        <div style="font-size: 10px; color: #f97316;">ERRORS: 0</div>
      </div>
    </div>
    <div style="font-size: 10px; color: rgba(229,242,255,0.5); border-top: 1px solid rgba(6,182,212,0.2); padding-top: 8px; display: flex; justify-content: space-between;">
      <span>LOAD: 0.42</span>
      <span>MEM: 12.4GB</span>
    </div>
  </div>`,
      name: "数据指挥舱",
      category: "数据分析/实时监控",
      accent: "#06b6d4",
      description: "深色实时数据大屏，指标卡片、网格背景、告警与趋势模块清晰分区",
      style: `【视觉主题】实时数据指挥舱，冷静、精密、态势感强
  【色彩系统】
   - 基础底色：深蓝黑 #06111f，面板 #0f1b2d。
   - 文本颜色：主文本 #e5f2ff，次要文本 #8aa4bf。
   - 强调色：青色 #06b6d4、绿色 #22c55e、告警橙 #f97316。
  【排版规则】
   - 字体：数字必须使用等宽数字；指标标签小而清楚。
   - 层级：核心 KPI 最大，趋势和告警次之，说明文字最弱。
  【组件特征】
   - 图表：用 CSS 绘制柱状条、折线近似、环形进度、状态灯和告警列表。
   - 面板：细描边、弱发光、网格背景；禁止复杂空白图表占位。
  【布局原则】适合运营监控、设备状态、业务大屏；所有数据模块必须有标题、单位和状态含义。`,
    },
  {
      id: "data-journalism",
      previewHtml: `<div style="font-family: sans-serif; background: #fbfbf8; padding: 16px; height: 100%; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
    <div>
      <div style="font-size: 10px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">DATA FOCUS / 深度解读</div>
      <div style="font-size: 15px; font-weight: 700; color: #1f2937; line-height: 1.3; margin-bottom: 10px;">主要前端渲染模式的耗时对比</div>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; margin-bottom: 3px;">
            <span>静态 SSR 导出 (M2V)</span>
            <strong>24ms</strong>
          </div>
          <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
            <div style="width: 20%; height: 100%; background: #0f766e; border-radius: 4px;"></div>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; margin-bottom: 3px;">
            <span>传统 Headless 截图</span>
            <strong>1,480ms</strong>
          </div>
          <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
            <div style="width: 90%; height: 100%; background: #d97706; border-radius: 4px;"></div>
          </div>
        </div>
      </div>
    </div>
    <div style="font-size: 10px; color: #6b7280; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between;">
      <span>数据来源：W3C Performance API</span>
      <span style="color: #0f766e; font-weight: bold;">效率提升 60x+</span>
    </div>
  </div>`,
      name: "数据新闻",
      category: "数据分析/数据叙事",
      accent: "#0f766e",
      description: "数据新闻风，图表与解释并重，适合研究结论和公众传播",
      style: `【视觉主题】数据新闻与解释型可视化，理性但亲近读者
  【色彩系统】
   - 基础底色：柔和白 #fbfbf8，图表底色 #f3f4f0。
   - 文本颜色：正文 #1f2937，注释 #6b7280。
   - 强调色：墨绿 #0f766e，辅助色琥珀 #d97706。
  【排版规则】
   - 字体：正文高可读，图表标签字号清晰，不要为了密度牺牲可读性。
   - 层级：先给一句结论，再给图表，最后给解释和来源。
  【组件特征】
   - 图表：条形图、排名表、对比卡、注释标线用 HTML/CSS 实现。
   - 来源：每个关键数据区域必须预留“数据来源/口径说明”。
  【布局原则】适合调研报告、行业数据解读、年度盘点；用故事解释数据，而不是堆仪表盘。`,
    },
];
