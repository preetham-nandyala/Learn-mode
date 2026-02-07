export const getTechColors = (title) => {
    title = title?.toLowerCase() || '';

    if (title.includes('html')) return { primary: '#E44D26', secondary: '#F16529', gradient: 'linear-gradient(135deg, #E44D26, #F16529)', border: 'rgba(255,255,255,0.3)' };
    if (title.includes('css')) return { primary: '#1572B6', secondary: '#33A9DC', gradient: 'linear-gradient(135deg, #1572B6, #33A9DC)', border: 'rgba(255,255,255,0.3)' };
    if (title.includes('javascript') || title.includes('js')) return { primary: '#F7DF1E', secondary: '#F7DF1E', gradient: 'linear-gradient(135deg, #F0DB4F, #F7DF1E)', text: '#323330', border: 'rgba(0,0,0,0.1)' };
    if (title.includes('react')) return { primary: '#61DAFB', secondary: '#00D8FF', gradient: 'linear-gradient(135deg, #61DAFB, #00D8FF)', text: '#323330', border: 'rgba(0,0,0,0.1)' };
    if (title.includes('python')) return { primary: '#366A96', secondary: '#FFC331', gradient: 'linear-gradient(135deg, #366A96, #FFC331)', border: 'rgba(255,255,255,0.3)' };
    if (title.includes('node')) return { primary: '#83CD29', secondary: '#68A063', gradient: 'linear-gradient(135deg, #83CD29, #68A063)', border: 'rgba(255,255,255,0.3)' };
    if (title.includes('java') && !title.includes('javascript')) return { primary: '#E76F00', secondary: '#5382A1', gradient: 'linear-gradient(135deg, #E76F00, #5382A1)', border: 'rgba(255,255,255,0.3)' };
    if (title.includes('sql') || title.includes('database')) return { primary: '#00758F', secondary: '#00A4C7', gradient: 'linear-gradient(135deg, #00758F, #00A4C7)', border: 'rgba(255,255,255,0.3)' };

    return { primary: '#3EB489', secondary: '#00B8A3', gradient: 'linear-gradient(135deg, #3EB489, #00B8A3)', border: 'rgba(255,255,255,0.3)' };
};
