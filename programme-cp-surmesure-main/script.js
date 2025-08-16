// script.js - Logic frontend et génération PDF

document.addEventListener('DOMContentLoaded', function() {
    
    const form = document.getElementById('programForm');
    const questionnaire = document.getElementById('questionnaire');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const downloadBtn = document.getElementById('downloadBtn');
    const programContent = document.getElementById('programContent');
    
    let generatedContent = '';

    // Gestion du formulaire
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validation
        const formData = new FormData(form);
        const data = {
            niveau: formData.get('niveau'),
            attention: formData.get('attention'),
            matiere: formData.get('matiere'),
            passion: formData.get('passion'),
            duree: formData.get('duree')
        };
        
        // Vérification que tous les champs sont remplis
        if (!data.niveau || !data.attention || !data.matiere || !data.passion || !data.duree) {
            alert('⚠️ Veuillez répondre à toutes les questions');
            return;
        }
        
        // Affichage du loading
        questionnaire.style.display = 'none';
        loading.style.display = 'block';
        
        try {
            // Appel à la fonction Netlify
            const response = await fetch('/.netlify/functions/generate-program', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || 'Erreur lors de la génération');
            }
            
            // Succès - affichage du résultat
            generatedContent = responseData.content;
            
            // Conversion markdown vers HTML basique
            const htmlContent = convertMarkdownToHTML(generatedContent);
            programContent.innerHTML = htmlContent;
            
            // Affichage du résultat
            loading.style.display = 'none';
            result.style.display = 'block';
            
            // Scroll vers le résultat
            result.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Erreur:', error);
            
            // Affichage de l'erreur
            loading.style.display = 'none';
            questionnaire.style.display = 'block';
            
            alert('😓 Désolé, une erreur est survenue. Veuillez réessayer.');
        }
    });
    
    // Gestion du téléchargement PDF
    downloadBtn.addEventListener('click', function() {
        generatePDF();
    });
    
    // Conversion basique markdown vers HTML
    function convertMarkdownToHTML(markdown) {
        let html = markdown;
        
        // Titres
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-gray-800">$1</h1>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 text-gray-700">$1</h2>');
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-2 text-gray-600">$1</h3>');
        
        // Gras
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        
        // Italique
        html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        
        // Listes à puces
        html = html.replace(/^- (.*$)/gim, '<li class="mb-1">$1</li>');
        html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>');
        
        // Paragraphes
        html = html.replace(/\n\n/g, '</p><p class="mb-4">');
        html = '<p class="mb-4">' + html + '</p>';
        
        // Nettoyage
        html = html.replace(/<p class="mb-4"><\/p>/g, '');
        
        // Images/illustrations
        html = html.replace(/\[Illustration : (.*?)\]/g, '<div class="bg-blue-50 border-2 border-dashed border-blue-300 p-4 mb-4 rounded-lg text-center text-blue-700"><strong>📸 Illustration :</strong> $1</div>');
        html = html.replace(/\[Image : (.*?)\]/g, '<div class="bg-green-50 border-2 border-dashed border-green-300 p-3 mb-3 rounded text-center text-green-700"><strong>🖼️ Image :</strong> $1</div>');
        html = html.replace(/\[Schéma : (.*?)\]/g, '<div class="bg-yellow-50 border-2 border-dashed border-yellow-300 p-3 mb-3 rounded text-center text-yellow-700"><strong>📊 Schéma :</strong> $1</div>');
        
        return html;
    }
    
    // Génération du PDF
    function generatePDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configuration
            doc.setFont("helvetica");
            
            // Titre
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("Programme CP Sur-Mesure", 20, 20);
            
            // Date
            const today = new Date().toLocaleDateString('fr-FR');
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Généré le: ${today}`, 20, 35);
            
            // Contenu
            const cleanContent = cleanContentForPDF(generatedContent);
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(cleanContent, 170);
            
            let y = 50;
            lines.forEach(line => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 20, y);
                y += 6;
            });
            
            // Téléchargement
            doc.save(`programme-cp-${today.replace(/\//g, '-')}.pdf`);
            
        } catch (error) {
            console.error('Erreur PDF:', error);
            alert('😓 Erreur lors de la génération du PDF.');
        }
    }
    
    // Nettoyage contenu pour PDF
    function cleanContentForPDF(content) {
        let cleaned = content;
        cleaned = cleaned.replace(/#{1,6}\s/g, '');
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
        cleaned = cleaned.replace(/\[.*?\]/g, '');
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        return cleaned;
    }
    
    // Validation en temps réel
    function checkFormValidity() {
        const questions = ['niveau', 'attention', 'matiere', 'passion', 'duree'];
        const answered = questions.every(name => {
            return form.querySelector(`input[name="${name}"]:checked`);
        });
        
        const submitBtn = document.getElementById('generateBtn');
        if (answered) {
            submitBtn.style.opacity = '1';
            submitBtn.disabled = false;
        } else {
            submitBtn.style.opacity = '0.6';
            submitBtn.disabled = true;
        }
    }
    
    // Écouter les changements
    form.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', checkFormValidity);
    });
    
    checkFormValidity();
});
