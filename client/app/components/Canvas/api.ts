import { fetcher } from '~/services/HTTPS';

export const getHtmlFormat = (data: any) => {
  const tables = data?.tables || [];
  const sections = data?.sections || [];
  const generatedCharts = data?.generated_charts || [];
  const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data?.takeaways[0]}</title>
    <style>
        :root {
            --primary: #2C3E50;
            --secondary: #34495E;
            --accent: #3498DB;
            --text: #2C3E50;
            --background: #FFFFFF;
            --muted: #95A5A6;
        }
        body {
            font-family: 'Roboto', system-ui, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--background);
            margin: 0;
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: 'Open Sans', system-ui, sans-serif;
            color: var(--primary);
            margin-top: 2em;
            margin-bottom: 1em;
            font-weight: bold;
        }
        h2 {
            font-size: 2em;
        }
        .title {
            color: var(--primary);
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            margin-top: 0;
        }
        .subtitle {
            color: var(--secondary);
            font-size: 1.5rem;
            margin-bottom: 2rem;
        }
      
        tr:nth-child(even) {
            background-color: rgba(0,0,0,0.05);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid var(--muted);
            padding: 0.75rem;
            text-align: left;
        }
        th {
            background-color: var(--primary);
            color: white;
        }
        .chart img {
            max-width: 100%;
            height: auto;
            margin-top: 20px;
        }
    </style>
</head>
<body>

    <div class="container">
        <h2>${data?.takeaways[0]}</h2>

         ${sections
           .map(
             (section: any) => `
            <h4>${section.title}</h4>
            <p>${section.content}</p>
          `
           )
           .join('')}

      
        ${tables
          .map(
            (table: any) => `
          <h4>${table.title}</h4>
          <table>
            <thead>
              <tr>
                ${table.headers.map((header: string) => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${table.rows
                .map(
                  (row: string[]) => `
                <tr>
                  ${row.map((cell) => `<td>${cell}</td>`).join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
          )
          .join('')}
       
          
        ${generatedCharts
          .map(
            (chart: any) => `<h4>${chart?.suggestion?.title}</h4>
        <div class="chart">
            <img src=${chart?.image} alt=${chart?.suggestion?.title}>
        </div>`
          )
          .join('')}

    </div>

</body>
</html>`;
  return HTML_TEMPLATE;
};

const templateHeading = [
  {
    heading: [
      'Market Overview',
      'Market Segmentation & Trends',
      'Competitive Landscape & Key Players',
      'Customer Insights & Buying Behavior',
      'Market Opportunities & Challenges',
      'Business & Marketing Strategy Implications',
      'Regional & Global Market Analysis',
    ],
    templateId: 'market-size',
  },
  {
    heading: [
      'Company Overview',
      'Business Model & Operations',
      'Industry Position & Competitive Landscape',
      'Financial Performance',
      'Corporate Actions & Strategic Initiatives',
      'Corporate Actions & Strategic Initiatives',
      ' Investment & Risk Analysis',
      'ESG (Environmental, Social, Governance) Factors',
    ],
    templateId: 'company-profile',
  },
  {
    heading: [
      'Company Overview & Financial Context',
      'Financial Statements Breakdown',
      'Ratio & Trend Analysis',
      'Comparative & Benchmarking Analysis',
      'Financial Health & Risk Assessment',
      'Valuation & Investment Potential',
    ],
    templateId: 'financial-statement-analysis',
  },
];

export const getDocumentReport = async ({
  title,
  templateId
}: {
  title: string;
  templateId : string;
}): Promise<string> => {
  try {
    const headingTemp = templateHeading.find((heading) => heading.templateId === templateId)
    const config: RequestInit = {
      method: 'POST',
      body: JSON.stringify({
        // markdown: 'stocks',
        // title: title,
        // sub_title: subTitle,
        // theme: 'professional',
        // instruction: title,
        // context: subTitle,
        text: title,
        headings: headingTemp?.heading,
        max_depth: 3,
        include_charts: true,
        include_tables: true,
      }),
    };

    const res = await fetcher('/api/research', config);
    const generatedHTML = await getHtmlFormat(res?.data);
    console.log('reports--------------------', res.data);
    return generatedHTML as string;
  } catch (error) {
    console.error(error);
    return error as string;
  }
};

export function getChatPosition(
  triggerPosition: DOMRect,
  Cwidth: number,
  Cheight: number,
  position?: string
): { top: string; left: string; position?: string } {
  if (!triggerPosition) {
    return { top: '0px', left: '0px' }; // Return empty string if trigger position is not available
  }

  const { top, left, width, height } = triggerPosition;

  const distance = 5; // Adjust this value to set the desired distance from the trigger
  if (!position) return { top: distance + height + 'px', left: width + 'px' };

  switch (position) {
    case 'top-left':
      return { top: -distance - Cheight + 'px', left: -Cwidth + 'px' };
    case 'top-center':
      return {
        top: -distance - Cheight + 'px',
        left: width / 2 - Cwidth / 2 + 'px',
      };
    case 'top-right':
      return { top: -distance - Cheight + 'px', left: width + 'px' };
    case 'center-left':
      return {
        top: width / 2 - Cheight / 2 + 'px',
        left: -Cwidth - distance + 'px',
      };
    case 'center-right':
      return {
        top: width / 2 - Cheight / 2 + 'px',
        left: width + distance + 'px',
      };
    case 'bottom-right':
      return { top: distance + height + 'px', left: width + 'px' };
    case 'bottom-center':
      return {
        top: distance + height + 'px',
        left: width / 2 - Cwidth / 2 + 'px',
      };
    case 'bottom-left':
      return { top: distance + height + 'px', left: -Cwidth + 'px' };
    default:
      return { top: distance + height + 'px', left: width + 'px' };
  }
}

export function getAnimationOrigin(position?: string) {
  if (!position) return 'origin-top-left';
  switch (position) {
    case 'top-left':
      return 'origin-bottom-right';
    case 'top-center':
      return 'origin-bottom';
    case 'top-right':
      return 'origin-bottom-left';
    case 'center-left':
      return 'origin-center';
    case 'center-right':
      return 'origin-center';
    case 'bottom-right':
      return 'origin-top-left';
    case 'bottom-center':
      return 'origin-top';
    case 'bottom-left':
      return 'origin-top-right';
    default:
      return 'origin-top-left';
  }
}

export function extractMessageFromOutput(output: {
  type: string;
  message: any;
}) {
  console.log(output);
  const { type, message } = output;
  if (type === 'text') return message;
  if (type === 'message') return message.text;
  if (type === 'object') return message.text;
  return 'Unknown message structure';
}
