import { fetcher } from '~/services/HTTPS';

export const getHtmlFormat = (data : any) => {
  const tables = data?.tables || []
  const sections = data?.sections || []
  const generatedCharts = data?.generated_charts || []
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

         ${sections.map((section : any) => `
            <h4>${section.title}</h4>
            <p>${section.content}</p>
          `).join('')}

      
        ${tables.map((table : any)  => `
          <h4>${table.title}</h4>
          <table>
            <thead>
              <tr>
                ${table.headers.map((header : string) => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${table.rows.map((row : string[]) => `
                <tr>
                  ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}
        {% endfor %}

        {% for chart in charts %}
        ${generatedCharts.map((chart: any)=>`<h4>${chart?.suggestion?.title}</h4>
        <div class="chart">
            <img src=${chart?.image} alt=${chart?.suggestion?.title}>
        </div>`
        ).join('')}

    </div>

</body>
</html>`;
return HTML_TEMPLATE;
};

export const getDocumentReport = async ({
  title,
  subTitle,
}: {
  title: string;
  subTitle: string;
}): Promise<string> => {
  try {
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
        headings: [
          'Market Overview',
          'Regional Analysis',
          'Top Manufacturers',
          'Future Projections',
        ],
        max_depth: 3,
        include_charts: true,
        include_tables: true,
      }),
    };

    const res = await fetcher('/api/research', config);
    const generatedHTML = await getHtmlFormat(res?.data);
    console.log('reports--------------------', generatedHTML)
    return generatedHTML as string;
  } catch (error) {
    console.error(error);
    return error as string;
  }
};
