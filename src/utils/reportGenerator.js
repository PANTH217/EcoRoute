import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * ESG Report Generator Utility
 * Generates a professional, branded PDF report based on fleet and trip data.
 */

export const generateESGReport = async (trips, stats) => {
    // Create a temporary container for the report layout
    const reportContainer = document.createElement('div');
    reportContainer.id = 'temp-esg-report';
    reportContainer.style.position = 'fixed';
    reportContainer.style.left = '-10000px';
    reportContainer.style.top = '0';
    reportContainer.style.width = '800px';
    reportContainer.style.padding = '40px';
    reportContainer.style.background = '#ffffff';
    reportContainer.style.color = '#1a1a1a';
    reportContainer.style.fontFamily = "'Inter', sans-serif";
    reportContainer.style.zIndex = '-1';

    const date = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    reportContainer.innerHTML = `
        <div style="border-bottom: 3px solid #00e676; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; letter-spacing: -0.5px;">Sustainability Audit Report</h1>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Eco-Route Optimizer Enterprise</p>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 24px;">🌿</div>
                <p style="margin: 0; font-size: 12px; color: #999;">Generated: ${date}</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
                <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Total Trips</p>
                <h2 style="margin: 10px 0 0 0; font-size: 24px; color: #1a1a1a;">${stats.totalTrips}</h2>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
                <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">CO₂ Saved</p>
                <h2 style="margin: 10px 0 0 0; font-size: 24px; color: #00e676;">${stats.totalSavingCo2} <span style="font-size: 14px;">kg</span></h2>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
                <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Fuel Saved</p>
                <h2 style="margin: 10px 0 0 0; font-size: 24px; color: #1a1a1a;">₹${stats.totalSavingCost.toLocaleString('en-IN')}</h2>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #eee;">
                <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase;">Assets Saved</p>
                <h2 style="margin: 10px 0 0 0; font-size: 24px; color: #1a1a1a;">${stats.totalVehiclesSaved}</h2>
            </div>
        </div>

        <h3 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; border-left: 4px solid #00e676; padding-left: 10px;">Executive Summary</h3>
        <p style="color: #444; line-height: 1.6; margin-bottom: 30px; font-size: 14px;">
            This audit report summarizes the environmental and operational impact of fleet movements managed through the Eco-Route Optimizer. 
            By prioritizing green corridors and co-loading opportunities, the organization has successfully averted <strong>${stats.totalSavingCo2} kg of CO₂ emissions</strong>, 
            equivalent to planting approximately <strong>${(stats.totalSavingCo2 / 20).toFixed(1)} mature trees</strong>.
        </p>

        <h3 style="font-size: 18px; margin-bottom: 15px; color: #1a1a1a; border-left: 4px solid #00e676; padding-left: 10px;">Recent Activity Logs</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
                <tr style="background: #f8f9fa; text-align: left;">
                    <th style="padding: 12px; border-bottom: 1px solid #eee;">Date</th>
                    <th style="padding: 12px; border-bottom: 1px solid #eee;">Route Info</th>
                    <th style="padding: 12px; border-bottom: 1px solid #eee;">Vehicle</th>
                    <th style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">CO₂ Saved</th>
                </tr>
            </thead>
            <tbody>
                ${trips.slice(0, 10).map(t => `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #fafafa;">${new Date(t.date).toLocaleDateString()}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #fafafa;">
                            <strong>${t.originName} → ${t.destinationName}</strong><br/>
                            <span style="color: #666;">${t.summary}</span>
                        </td>
                        <td style="padding: 12px; border-bottom: 1px solid #fafafa;">${t.vehicleName}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #fafafa; text-align: right; color: #00e676; font-weight: 600;">+${t.savingCo2} kg</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 10px;">
            <p>Confidential Sustainability Audit | Part of Global SDG 12 Compliance Framework</p>
        </div>
    `;

    document.body.appendChild(reportContainer);

    try {
        const canvas = await html2canvas(reportContainer, {
            scale: 2, // Better resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`ESG_Report_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error('PDF Generation Failed:', error);
        throw error;
    } finally {
        document.body.removeChild(reportContainer);
    }
};
