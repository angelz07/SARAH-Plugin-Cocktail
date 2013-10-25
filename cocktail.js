var ingredient_2_precedent;
exports.action = function (data, callback, config, SARAH) {
    var tableau_alcool = new Array();
    var tableau_soft  = new Array();
    var tts_reponse;
	// Retrieve config
    var  api_url;
    config = config.modules.cocktail;
    
	 if(config.mode_mysql == "[FIXME]"){
        callback({'tts': "il manque la configuration du mode"});
        return;
    }
    switch (data.commande) {
        case 'liste_boisson':
				if(config.mode_mysql == "mysql"){
					if(config.addr_sarah_php == "[FIXME]"){
						callback({'tts': "il manque la configuration de la page sarah.php"});
						return;
					}
					var adresse_php = config.addr_sarah_php;
					liste_alcool_mysql(callback,adresse_php);
				}
				if(config.mode_mysql == "text"){
					liste_alcool_text(callback);
				}
				
            break;

        case 'recherche_coctails':
         	var ingredient_2_choix_1 = choix_ingrédient(false,data.type_boisson)
            var ingredient_2_choix_2 = choix_ingrédient(true,data.type_boisson)
            recherche_cocktail(data.boisson,ingredient_2_choix_1,ingredient_2_choix_2,callback);


            break;
        case 'select_coctails':
            var cocktail = data.cocktail
            var adresse = data.adresse
            
            SARAH.remote({ 'run' : 'chrome.exe', 'runp' : adresse });﻿

            break;

//
	 	default:
            callback({});
            break;
    }   
    
    callback({'tts': tts_reponse});
    return;

    /*
http://www.1001cocktails.com/cocktails/rechercheCocktailsIng.php?mot2=rhum&mot3=coca&type=&preparation=&recipient=&alcool=tous&cout=Tous&difficulte=Tous&ok2=Rechercher+les+Cocktails

    */
}



function choix_ingrédient(last,type_ingredient){
    var ingredient2 = "";
    if(last == false){
        if(type_ingredient == 'alcool'){
            ingredient2 = tableau_soft[Math.floor(Math.random() * tableau_soft.length)];
        }
        if(type_ingredient == 'soft')
        {
            ingredient2 = tableau_alcool[Math.floor(Math.random() * tableau_alcool.length)];
        }
        ingredient_2_precedent = ingredient2;
        return ingredient2;
    }
    else{
        
        if(type_ingredient == 'alcool'){
            while (ingredient2 == "" || ingredient2 == ingredient_2_precedent) {
              ingredient2 = tableau_soft[Math.floor(Math.random() * tableau_soft.length)];
            }
            
        }
        if(type_ingredient == 'soft')
        {
            while (ingredient2 == "" && ingredient2 == ingredient_2_precedent) {
                ingredient2 = tableau_alcool[Math.floor(Math.random() * tableau_alcool.length)];
            }
        }
        ingredient_2_precedent = ingredient2;
        return ingredient2;
    }
    
}

function scraping_site(last,body){
    if(last == false){
        var cheerio = require('cheerio');
        var $ = cheerio.load(body);
        var nbr_max = 0;
        titre = $('#content strong a');

        var tableau_retour = new Array();
        $(titre).each(function(i, titre){
            if(nbr_max < 3){
                //console.log($(titre).text() + ':\n  '/* + $(titre).attr('href')*/);
                var url_infos = 'http://www.1001cocktails.com'+$(titre).attr('href');
                tableau_retour.push(url_infos)
                nbr_max = nbr_max + 1;
            }

        });
        return tableau_retour;
    //choix_ingrédient_bis(type_ingredient,ingredient_1,ingredient_2,tts_liste_cocktail,callback)

    }
    
}

function recherche_cocktail(ingredient_1,ingredient_2_choix_1,ingredient_2_choix_2,callback){
    var request = require("request");
    var url = 'http://www.1001cocktails.com/cocktails/rechercheCocktailsIng.php?mot2=' + ingredient_1 + '&mot3=' + ingredient_2_choix_1 + '&type=&preparation=directement+dans+le+verre&recipient=&alcool=tous&cout=Tous&difficulte=FACILE&ok2=Rechercher+les+Cocktails';
    request({ 'uri': url }, function(error, response, retour) {
        if (error || response.statusCode != 200) {
            callback({'tts': "erreur"});
            console.log("erreur");
            return;
        }
        var tts_liste_cocktail = ' je peux vous proposer sur base de ' + ingredient_1 + ' et de ' + ingredient_2_choix_1 + ' les cocktails suivant : . '
        var retour_scrap_1 = scraping_site(false,retour);
       
        var addresse_1
        if(!retour_scrap_1[0]){
           addresse_1 = 'null'; 
        }
        else{
           addresse_1 = retour_scrap_1[0];
        }
        
        
        var addresse_2
        if(!retour_scrap_1[1]){
           addresse_2 = 'null'; 
        }else{
           addresse_2 = retour_scrap_1[1];
        }


        var addresse_3
        if(!retour_scrap_1[2]){
           addresse_3 = 'null'; 
        }else{
           addresse_3 = retour_scrap_1[2];
        }
   
       demande_infos_1(addresse_1,addresse_2,addresse_3,ingredient_1,ingredient_2_choix_1,ingredient_2_choix_2,callback,tts_liste_cocktail)
    });
}


function demande_infos_1(addresse_1,addresse_2,addresse_3,ingredient_1,ingredient_2_choix_1,ingredient_2_choix_2,callback,tts_liste_cocktail){
    if(addresse_1 == 'null'){
         var ligne_insert = "<!--¤  Liste coctails ¤-->\n";
           // ligne_insert = ligne_insert + "<one-of>\n";
        recherche_cocktail_bis(ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
    }
    else{
        var request = require("request");
        var url = addresse_1;
        request({ 'uri': url }, function(error, response, retour) {
            if (error || response.statusCode != 200) {
                callback({'tts': "erreur"});
                console.log("erreur");
                return;
            }
            
            var cheerio = require('cheerio');
            var $ = cheerio.load(retour);

            titre = $("h1[itemprop$='name']");
            ingredient_recette = $("a[itemprop$='ingredients']");

            var ligne_insert = "<!--¤  Liste coctails ¤-->\n";
            //ligne_insert = ligne_insert + "<one-of>\n";

            var nom_cocktail = $(titre).text();
            nom_cocktail = remove_regex(nom_cocktail,"parenthese",'')
            

            ligne_insert = ligne_insert + '<item>'+nom_cocktail+'<tag>out.action.cocktail="' + nom_cocktail + '";out.action.adresse="' + addresse_1 + '";</tag></item> \n';
            tts_liste_cocktail = tts_liste_cocktail + nom_cocktail + ' . avec comme ingrédient : . '

            $(ingredient_recette).each(function(i, ingredient_recette){
                var nom_ingr = $(ingredient_recette).text();
                nom_ingr = remove_regex(nom_ingr,"parenthese",'')
               nom_ingr = remove_regex(nom_ingr,"cola",'coca')
                tts_liste_cocktail = tts_liste_cocktail + nom_ingr + ' ,, '
            });

           demande_infos_2(addresse_2,addresse_3,ingredient_1,ingredient_2_choix_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
        });
    }
}

function demande_infos_2(addresse_2,addresse_3,ingredient_1,ingredient_2_choix_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert){
    if(addresse_2 == 'null'){
        recherche_cocktail_bis(ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
    }
    else{
        var request = require("request");
        var url = addresse_2;
        request({ 'uri': url }, function(error, response, retour) {
            if (error || response.statusCode != 200) {
                callback({'tts': "erreur"});
                console.log("erreur");
                return;
            }
            
            var cheerio = require('cheerio');
            var $ = cheerio.load(retour);

            titre = $("h1[itemprop$='name']");
            ingredient_recette = $("a[itemprop$='ingredients']");

            var nom_cocktail = $(titre).text();
            nom_cocktail = remove_regex(nom_cocktail,"parenthese",'')
            
            ligne_insert = ligne_insert + '<item>'+nom_cocktail+'<tag>out.action.cocktail="' + nom_cocktail + '";out.action.adresse="' + addresse_2 + '";</tag></item> \n';
            tts_liste_cocktail = tts_liste_cocktail + ' . Ou encore : . ' + nom_cocktail + ' . avec comme ingrédient : . '
 
            $(ingredient_recette).each(function(i, ingredient_recette){
                var nom_ingr = $(ingredient_recette).text();
                nom_ingr = remove_regex(nom_ingr,"parenthese",'')
                nom_ingr = remove_regex(nom_ingr,"cola",'coca')
                tts_liste_cocktail = tts_liste_cocktail + nom_ingr + ' ,, '
            });

           
           demande_infos_3(addresse_3,ingredient_1,ingredient_2_choix_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
        });
    }
}


function demande_infos_3(addresse_3,ingredient_1,ingredient_2_choix_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert){
    if(addresse_3 == 'null'){
        recherche_cocktail_bis(ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
    }
    else{
        var request = require("request");
        var url = addresse_3;
        request({ 'uri': url }, function(error, response, retour) {
            if (error || response.statusCode != 200) {
                callback({'tts': "erreur"});
                console.log("erreur");
                return;
            }
            
            var cheerio = require('cheerio');
            var $ = cheerio.load(retour);

            titre = $("h1[itemprop$='name']");
            ingredient_recette = $("a[itemprop$='ingredients']");

            var nom_cocktail = $(titre).text();
            nom_cocktail = remove_regex(nom_cocktail,"parenthese",'')
        
            ligne_insert = ligne_insert + '<item>'+nom_cocktail+'<tag>out.action.cocktail="' + nom_cocktail + '";out.action.adresse="' + addresse_3 + '";</tag></item> \n';
            tts_liste_cocktail = tts_liste_cocktail + ' . Ou encore : . ' + nom_cocktail + ' . avec comme ingrédient : .'
 

            $(ingredient_recette).each(function(i, ingredient_recette){
                var nom_ingr = $(ingredient_recette).text();
                nom_ingr = remove_regex(nom_ingr,"parenthese",'')
                nom_ingr = remove_regex(nom_ingr,"cola",'coca')
                tts_liste_cocktail = tts_liste_cocktail + nom_ingr + ' ,, '
            });

           //console.log(tts_liste_cocktail)
           //console.log(ligne_insert)
           recherche_cocktail_bis(ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
        });
    }
}

function recherche_cocktail_bis(ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert){
    var request = require("request");
    var url = 'http://www.1001cocktails.com/cocktails/rechercheCocktailsIng.php?mot2=' + ingredient_1 + '&mot3=' + ingredient_2_choix_2 + '&type=&preparation=directement+dans+le+verre&recipient=&alcool=tous&cout=Tous&difficulte=FACILE&ok2=Rechercher+les+Cocktails';
    request({ 'uri': url }, function(error, response, retour) {
        if (error || response.statusCode != 200) {
            callback({'tts': "erreur"});
            console.log("erreur");
            return;
        }
        tts_liste_cocktail = tts_liste_cocktail + '. ou alors je peux vous proposer sur base de ' + ingredient_1 + ' et de ' + ingredient_2_choix_2 + ' les cocktails suivant : . '
        var retour_scrap_2 = scraping_site(false,retour);
        var addresse_1
        if(!retour_scrap_2[0]){
           addresse_1 = 'null'; 
        }
        else{
           addresse_1 = retour_scrap_2[0];
        }
        
        
        var addresse_2
        if(!retour_scrap_2[1]){
           addresse_2 = 'null'; 
        }else{
           addresse_2 = retour_scrap_2[1];
        }


        var addresse_3
        if(!retour_scrap_2[2]){
           addresse_3 = 'null'; 
        }else{
           addresse_3 = retour_scrap_2[2];
        }
   

       demande_infos_1_bis(addresse_1,addresse_2,addresse_3,ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
    });
}

function demande_infos_1_bis(addresse_1,addresse_2,addresse_3,ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert){
    if(addresse_1 == 'null'){
        modification_lazyxlm_cocktail(callback,tts_liste_cocktail,ligne_insert)
    }
    else{
        var request = require("request");
        var url = addresse_1;
        request({ 'uri': url }, function(error, response, retour) {
            if (error || response.statusCode != 200) {
                callback({'tts': "erreur"});
                console.log("erreur");
                return;
            }
            
            var cheerio = require('cheerio');
            var $ = cheerio.load(retour);

            titre = $("h1[itemprop$='name']");
            ingredient_recette = $("a[itemprop$='ingredients']");

            var nom_cocktail = $(titre).text();
            nom_cocktail = remove_regex(nom_cocktail,"parenthese",'')
        

            ligne_insert = ligne_insert + '<item>'+nom_cocktail+'<tag>out.action.cocktail="' + nom_cocktail + '";out.action.adresse="' + addresse_1 + '";</tag></item> \n';
            tts_liste_cocktail = tts_liste_cocktail + nom_cocktail + ' . avec comme ingrédient : . '


            $(ingredient_recette).each(function(i, ingredient_recette){
                var nom_ingr = $(ingredient_recette).text();
                nom_ingr = remove_regex(nom_ingr,"parenthese",'')
                nom_ingr = remove_regex(nom_ingr,"cola",'coca')
                tts_liste_cocktail = tts_liste_cocktail + nom_ingr + ' ,, '
            });
           
          demande_infos_2_bis(addresse_2,addresse_3,ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
        });

        
    }
}


function demande_infos_2_bis(addresse_2,addresse_3,ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert){
    
    if(addresse_2 == 'null'){
        modification_lazyxml_cocktail(callback,tts_liste_cocktail,ligne_insert)
    }
    else{
        var request = require("request");
        var url = addresse_2;
        request({ 'uri': url }, function(error, response, retour) {
            if (error || response.statusCode != 200) {
                callback({'tts': "erreur"});
                console.log("erreur");
                return;
            }
            
            var cheerio = require('cheerio');
            var $ = cheerio.load(retour);

            titre = $("h1[itemprop$='name']");
            ingredient_recette = $("a[itemprop$='ingredients']");

            var nom_cocktail = $(titre).text();
            nom_cocktail = remove_regex(nom_cocktail,"parenthese",'')
        
            ligne_insert = ligne_insert + '<item>'+nom_cocktail+'<tag>out.action.cocktail="' + nom_cocktail + '";out.action.adresse="' + addresse_2 + '";</tag></item> \n';
            tts_liste_cocktail = tts_liste_cocktail + '. Ou encore : . ' + nom_cocktail + ' . avec comme ingrédient : .'
 
            $(ingredient_recette).each(function(i, ingredient_recette){
                var nom_ingr = $(ingredient_recette).text();
                nom_ingr = remove_regex(nom_ingr,"parenthese",'')
                nom_ingr = remove_regex(nom_ingr,"cola",'coca')
                tts_liste_cocktail = tts_liste_cocktail + nom_ingr + ' ,, '
            });

           demande_infos_3_bis(addresse_3,ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert)
        });
    }
}
function demande_infos_3_bis(addresse_3,ingredient_1,ingredient_2_choix_2,callback,tts_liste_cocktail,ligne_insert){
    if(addresse_3 == 'null'){
        modification_lazyxml_cocktail(callback,tts_liste_cocktail,ligne_insert)
    }
    else{
        var request = require("request");
        var url = addresse_3;
        request({ 'uri': url }, function(error, response, retour) {
            if (error || response.statusCode != 200) {
                callback({'tts': "erreur"});
                console.log("erreur");
                return;
            }
            
            var cheerio = require('cheerio');
            var $ = cheerio.load(retour);

            titre = $("h1[itemprop$='name']");
            ingredient_recette = $("a[itemprop$='ingredients']");

            var nom_cocktail = $(titre).text();
            nom_cocktail = remove_regex(nom_cocktail,"parenthese",'')
        
            ligne_insert = ligne_insert + '<item>'+nom_cocktail+'<tag>out.action.cocktail="' + nom_cocktail + '";out.action.adresse="' + addresse_3 + '";</tag></item> \n';
            tts_liste_cocktail = tts_liste_cocktail + '. Ou encore : . ' + nom_cocktail + ' . avec comme ingrédient : .'
 
            $(ingredient_recette).each(function(i, ingredient_recette){
                var nom_ingr = $(ingredient_recette).text();
                nom_ingr = remove_regex(nom_ingr,"parenthese",'')
                nom_ingr = remove_regex(nom_ingr,"cola",'coca')
                tts_liste_cocktail = tts_liste_cocktail + nom_ingr + ' ,. '
            });
            //ligne_insert = ligne_insert + '</one-of>\n'
            ligne_insert = ligne_insert + '<!--¤  Fin Liste cocktail ¤-->\n'
           
          modification_lazyxml_cocktail(callback,tts_liste_cocktail,ligne_insert)
        });
    }
}
function modification_lazyxml_cocktail(callback,tts_liste_cocktail,ligne_insert){

 //   console.log(tts_liste_cocktail)
 //   console.log(ligne_insert)

    var fs = require('fs');
    var fileXML = 'plugins/cocktail/lazycocktail.xml';
    var xml = fs.readFileSync(fileXML, 'utf8');

    // effacement des alcools
    var replace_cocktail = '<!--¤  Liste coctails ¤-->\n<!--¤  Fin Liste cocktail ¤-->';
    var regexp_cocktail = new RegExp('<!--¤  Liste coctails ¤-->[^*]+<!--¤  Fin Liste cocktail ¤-->', 'gm');
    var regexp_lignevide = new RegExp('^\n', 'gm');
    var xml = xml.replace(regexp_cocktail, replace_cocktail);
    var xml = xml.replace(regexp_lignevide, "");

    fs.writeFileSync(fileXML, xml, 'utf8');
    console.log('plugin Cocktails - Zone génération automatique Cocktails éffacée.')

    // remplacement et ecriture des boisson dans le fichier lazy
    var xml = xml.replace(regexp_cocktail, ligne_insert);
    fs.writeFileSync(fileXML, xml, 'utf8');
    console.log('plugin Cocktails - Zone génération automatique Cocktails ajoutée.')

    
    callback({'tts': tts_liste_cocktail});
    return;
}
/******************************************/
/* Ajout dans le fichier XML des boisson  */
/******************************************/

function liste_alcool_mysql(callback,adresse_php){
    var request = require("request");
    var url = adresse_php + '?sarah=list_alcool';
   // console.log(url)
    request({ 'uri': url , 'json' : true }, function(error, response, retour) {
        if (error || response.statusCode != 200) {
            callback({'tts': "erreur"});
            console.log("erreur");
            return;
        }
        var donnees = eval('('+retour+')');
        tableau_alcool = new Array();
        for (var i =0;i<donnees.liste.length;i++){
            if(donnees.liste[i].quantite > 0){
                tableau_alcool.push(donnees.liste[i].nom)
            }
        }
        
        liste_soft(callback,adresse_php);
    });
}

function liste_soft(callback,adresse_php){
    var request = require("request");
    var url = adresse_php + '?sarah=list_soft';
    request({ 'uri': url , 'json' : true }, function(error, response, retour) {
        if (error || response.statusCode != 200) {
            callback({'tts': "erreur"});
            console.log("erreur");
            return;
        }
        var donnees = eval('('+retour+')');
        tableau_soft = new Array();
        for (var i =0;i<donnees.liste.length;i++){
            if(donnees.liste[i].quantite > 0){
                tableau_soft.push(donnees.liste[i].nom)
            }
        }
        ajout_boisson_xml(tableau_alcool,tableau_soft,callback);
    });
}



function ajout_boisson_xml(alcool,soft,callback){
    
    var fs = require('fs');
    var fileXML = 'plugins/cocktail/lazycocktail.xml';
    var xml = fs.readFileSync(fileXML, 'utf8');

    // effacement des alcools
    var replace_alcool = '<!--¤  Liste alcools ¤-->\n<!--¤  Fin Liste alcools ¤-->';
    var regexp_alcool = new RegExp('<!--¤  Liste alcools ¤-->[^*]+<!--¤  Fin Liste alcools ¤-->', 'gm');
    var xml = xml.replace(regexp_alcool, replace_alcool);
    fs.writeFileSync(fileXML, xml, 'utf8');
    console.log('plugin Cocktails - Zone génération automatique Alcool éffacée.')

    

    // effacement des softs
    var replace_soft = '<!--¤  Liste softs ¤-->\n<!--¤  Fin Liste softs ¤-->';
    var regexp_soft = new RegExp('<!--¤  Liste softs ¤-->[^*]+<!--¤  Fin Liste softs ¤-->', 'gm');
    var xml = xml.replace(regexp_soft, replace_soft);
    fs.writeFileSync(fileXML, xml, 'utf8');
    console.log('plugin Cocktails - Zone génération automatique Softs éffacée.')

    
    
    var regexp_boisson = new RegExp('<!--¤  Liste alcools ¤-->[^*]+<!--¤  Fin Liste softs ¤-->', 'gm');
    
    
    var ligne_insert = "<!--¤  Liste alcools ¤-->\n";
   // ligne_insert = ligne_insert + "<one-of>\n";
    var tts_reponse = "il y a pour le moment de disponible les alcools suivant : ";
    for (var i =0;i<alcool.length;i++){
        if(i==alcool.length-1){
            tts_reponse = tts_reponse + alcool[i];
        }
        else{
            tts_reponse = tts_reponse + alcool[i] + ' , ';
            }
        ligne_insert = ligne_insert + '<item>'+ alcool[i] + '<tag>out.action.type_boisson="alcool";out.action.boisson="'+ alcool[i] +'";</tag></item> \n'
    }

    ligne_insert = ligne_insert + "<!--¤  Fin Liste alcools ¤-->\n"

    ligne_insert = ligne_insert + "<!--¤  Liste softs ¤-->\n";
    tts_reponse = tts_reponse + ". Et pour les softs : ";
    for (var i =0;i<soft.length;i++){
        if(i==soft.length-1){
            tts_reponse = tts_reponse + soft[i];
        }
        else{
            tts_reponse = tts_reponse + soft[i] + ' , ';
        }
        ligne_insert = ligne_insert + '<item>'+ soft[i] + '<tag>out.action.type_boisson="soft";out.action.boisson="'+ soft[i] +'";</tag></item> \n'
    }

   // ligne_insert = ligne_insert + "</one-of>\n";
    ligne_insert = ligne_insert + "<!--¤  Fin Liste softs ¤-->\n"
    var regexp_lignevide = new RegExp('^\n', 'gm');
    // remplacement et ecriture des boisson dans le fichier lazy
    var xml = xml.replace(regexp_boisson, ligne_insert);
    var xml = xml.replace(regexp_lignevide, "");
    fs.writeFileSync(fileXML, xml, 'utf8');
    console.log('plugin Cocktails - Zone génération automatique Boisson ajoutée.')


    //console.log(tts_reponse)

    //callback({'tts': tts_reponse});
    callback({'tts': tts_reponse});
    return;
        
}
/**********************************************/
/* Fin Ajout dans le fichier XML des boisson  */
/**********************************************/

function remove_regex(string,demande,replace){
    var string_modifie = '';
    switch (demande) {
        case 'parenthese':
                 string_modifie = string.replace(/\([^)]*\)/gi, replace);
            break;

        case 'cola':
            string_modifie = string.replace(/cola/gi, replace);
            break;
        case 'select_coctails':
           
           break;
        
        default:
            
            break;
    }
    return string_modifie
}

function anglais_francais(string){
    string = string.replace(/after)/gi, 'afteur');
    string = string.replace(/ice/gi, 'ays');
    string = string.replace(/tea/gi, 'tii');

    return string;
}


/****************************************************/
/* Ajout dans le fichier XML des boisson MODE TEXT  */
/****************************************************/
function liste_alcool_text(callback){
	var fs = require("fs");
	var contenu;

	contenu = fs.readFileSync("plugins/cocktail/boisson.js", "UTF-8");
	var regexp = new RegExp('\r\n', 'gm');
	
	contenu = contenu.replace(regexp, '');
	boisson = JSON.parse(contenu);
	
	tableau_alcool = new Array();
    for (var i =0;i<boisson.alcools.length;i++){
        tableau_alcool.push(boisson.alcools[i])
    }

	tableau_soft = new Array();
    for (var i =0;i<boisson.softs.length;i++){
        tableau_soft.push(boisson.softs[i])
    }

	ajout_boisson_xml(tableau_alcool,tableau_soft,callback);
	
}

/********************************************************/
/* Fin Ajout dans le fichier XML des boisson MODE TEXT  */
/********************************************************/
