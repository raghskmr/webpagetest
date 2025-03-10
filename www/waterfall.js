// Copyright 2020 Catchpoint Systems Inc.
// Use of this source code is governed by the Polyform Shield 1.0.0 license that can be
// found in the LICENSE.md file.
var wptRequestDialogInited = {};

function InitRequestDialog(step) {
    var stepLabel = "step" + step;
    if (wptRequestDialogInited[stepLabel] === true) {
        return;
    }

    var CloseRequestDialog = function(hash) {
        hash.w.hide();
        for (i=1;i<=wptRequestCount[stepLabel];i++) {
            $("#request-overlay-" + stepLabel + "-" + i).removeClass("selected");
            $("#request-overlay-" + stepLabel + "-" + i).addClass("transparent");
        }
        $('#radio1-' + stepLabel).attr('checked', 'checked');
        $("#request-dialog-radio-" + stepLabel).buttonset('refresh');
        $("#dialog-contents-" + stepLabel + " div.dialog-tab-content").hide();
        $("#request-details-" + stepLabel).show();
    }

    // initialize the pop-up dialog
    $('#request-dialog-' + stepLabel).jqm({overlay: 0, onHide: CloseRequestDialog})
          .jqDrag('.jqDrag');
    $('input.jqmdX')
        .hover( function(){ $(this).addClass('jqmdXFocus'); },
                function(){ $(this).removeClass('jqmdXFocus'); })
        .focus( function(){ this.hideFocus=true; $(this).addClass('jqmdXFocus'); })
        .blur( function(){ $(this).removeClass('jqmdXFocus'); });

    $("#request-dialog-radio-" + stepLabel).buttonset();
    $("#request-dialog-radio-" + stepLabel).change(function() {
        var panel=$('#request-dialog-radio-' + stepLabel + ' input[type=radio]:checked').val();
        $("#dialog-contents-" + stepLabel + " div.dialog-tab-content").hide();
        $("#" + panel).show();
    });
    wptRequestDialogInited[stepLabel] = true;
}

var wptBodyRequest;

// Test that a value is a valid duration.
// Invalid durations include undefined and -1.
function IsValidDuration(value) {
    // Explicitly check the type.  Would you have guessed that Number(['9'])
    // is 9?  We need to support strings because php makes it too easy to
    // send a number as a string.  We need to support numbers like "123.4".
    if (typeof value != 'number' && typeof value != 'string')
        return false;

    // Number('') is 0, but the empty string is not a valid duration.
    if (value === '')
        return false;

    var num = Number(value);
    return (!isNaN(num) && num !== -1);
}

function NumBytesAsDisplayString(numBytes) {
    var numKb = numBytes / 1024.0;

    // We display kilobytes with one decimal point.  If the value with that
    // precision would be zero, display bytes instead.
    if (numKb >= 0.1) {
        return numKb.toFixed(1) + ' KB';
    }
    return numBytes + ' B';
}

function htmlEncode(value){
    if (value !== undefined) {
        return jQuery('<div />').text(value).html();
    } else {
        return '';
    }
}

function SelectRequest(step, request) {
    InitRequestDialog(step);
    var stepLabel = "step" + step;
    $('#request-dialog-' + stepLabel).css('top', $("#request-overlay-" + stepLabel + "-" + request).position().top + 20);
    $("#dialog-title-" + stepLabel).html('<a href="#' + stepLabel + '_request' + request + '">Request #' + request + '</a>');
    var details='';
    var requestHeaders='';
    var responseHeaders='';
    var experiment = '<ul class="experiments">';
    let json = '';
    $("#response-body-" + stepLabel).html('');
    try {
        if (wptBodyRequest !== undefined)
            wptBodyRequest.abort();
    } catch (err) {
    }
    if (wptRequestData[stepLabel][request - 1] !== undefined) {
        var r = wptRequestData[stepLabel][request - 1];
        json = JSON.stringify(r, null, 4);
        if (r['full_url'] !== undefined) {
            if (wptNoLinks) {
                details += '<b>URL:</b> ' + htmlEncode(r['full_url']) + '<br>';
            } else {
                details += '<b>URL:</b> <a href="' + htmlEncode(r['full_url']) + '">' + htmlEncode(r['full_url']) + '</a><br>';
            }
            experiment += '<li><a href="#" data-block="' + htmlEncode(r['full_url']) + '">Block Request URL</a></li>';
        }
        if (r['initiator'] !== undefined && r['initiator'].length > 0) {
            details += '<b>Loaded By:</b> ' + htmlEncode(r['initiator']);
            if (r['initiator_line'] !== undefined)
                details += ':' + htmlEncode(r['initiator_line']);
            details += '<br>';
        }
        if (r['documentURL'] !== undefined)
            details += '<b>Document: </b>' + htmlEncode(r['documentURL']) + '<br>';
        if (r['host'] !== undefined)
            details += '<b>Host: </b>' + htmlEncode(r['host']) + '<br>';
            experiment += '<li><a href="#" data-block-domain="' + htmlEncode(r['host']) + '">Block Request Domain</a></li>';
        if (r['ip_addr'])
            details += '<b>IP: </b>' + htmlEncode(r['ip_addr']) + '<br>';
        if (r['location'] !== undefined && r['location'] !== null && r['location'].length)
            details += '<b>Location: </b>' + htmlEncode(r['location']) + '<br>';
        if (r['responseCode'] !== undefined)
            details += '<b>Error/Status Code: </b>' + htmlEncode(r['responseCode']) + '<br>';
        if (r['priority'] !== undefined && r['priority'].length > 0)
            details += '<b>Priority: </b>' + htmlEncode(r['priority']) + '<br>';
        if (r['protocol'] !== undefined)
            details += '<b>Protocol: </b>' + htmlEncode(r['protocol']) + '<br>';
        if (r['http2_stream_id'] !== undefined && r['http2_stream_id'] > 0) {
          details += "<b>HTTP/2 Stream: </b>" + htmlEncode(r['http2_stream_id']);
          if (r['http2_stream_weight'] !== undefined)
            details += ", weight " + htmlEncode(parseInt(r['http2_stream_weight']));
          if (r['http2_stream_dependency'] !== undefined)
            details += ", depends on " + htmlEncode(r['http2_stream_dependency']);
          if (r['http2_stream_exclusive'] !== undefined && (r['http2_stream_exclusive'] > 0 || r['http2_stream_exclusive'] === "True"))
            details += ", EXCLUSIVE";
          details += '<br>';
        }
        if (r['was_pushed'] !== undefined && r['was_pushed'] > 0)
            details += '<b>SERVER PUSHED</b><br>';
        if (r['request_id'] !== undefined && r['request_id'] !== null && r['request_id'].length)
            details += '<b>Request ID: </b>' + htmlEncode(r['request_id']) + '<br>';
        if (r['client_port'] !== undefined && r['client_port'] !== null && r['client_port'])
            details += '<b>Client Port: </b>' + htmlEncode(r['client_port']) + '<br>';
        if (r['created'] !== undefined)
            details += '<b>Discovered: </b>' + (r['created'] / 1000.0).toFixed(3) + ' s<br>';
        if (r['load_start'] !== undefined)
            details += '<b>Request Start: </b>' + (r['load_start'] / 1000.0).toFixed(3) + ' s<br>';
        if (IsValidDuration(r['dns_ms'])) {
            details += '<b>DNS Lookup: </b>' + htmlEncode(r['dns_ms']) + ' ms<br>';
        } else if( r['dns_end'] !== undefined && r['dns_start'] !== undefined && r['dns_end'] > 0 ) {
            var dnsTime = r['dns_end'] - r['dns_start'];
            details += '<b>DNS Lookup: </b>' + dnsTime + ' ms<br>';
        }
        if (IsValidDuration(r['connect_ms'])) {
            details += '<b>Initial Connection: </b>' + htmlEncode(r['connect_ms']) + ' ms<br>';
            if (r['is_secure'] !== undefined && r['is_secure'] && IsValidDuration(r['ssl_ms'])) {
                details += '<b>SSL Negotiation: </b>' + htmlEncode(r['ssl_ms']) + ' ms<br>';
            }
        } else if( r['connect_end'] !== undefined && r['connect_start'] !== undefined && r['connect_end'] > 0 ) {
            var connectTime = r['connect_end'] - r['connect_start'];
            details += '<b>Initial Connection: </b>' + connectTime + ' ms<br>';
            if( r['ssl_end'] !== undefined && r['ssl_start'] !== undefined && r['ssl_end'] > 0 ) {
                var sslTime = r['ssl_end'] - r['ssl_start'];
                details += '<b>SSL Negotiation: </b>' + sslTime + ' ms<br>';
            }
        }
        if (IsValidDuration(r['ttfb_ms'])) {
            details += '<b>Time to First Byte: </b>' + htmlEncode(r['ttfb_ms']) + ' ms<br>';
        }
        if (IsValidDuration(r['download_ms']))
            details += '<b>Content Download: </b>' + htmlEncode(r['download_ms']) + ' ms<br>';
        if (r['bytesIn'] !== undefined)
            details += '<b>Bytes In (downloaded): </b>' + NumBytesAsDisplayString(r['bytesIn']) + '<br>';
        if (r['objectSizeUncompressed'] !== undefined)
            details += '<b>Uncompressed Size: </b>' + NumBytesAsDisplayString(r['objectSizeUncompressed']) + '<br>';
        if (r['certificate_bytes'] !== undefined && r['certificate_bytes'] > 0)
            details += '<b>Certificates (downloaded): </b>' + r['certificate_bytes'] + ' B<br>';
        if (r['bytesOut'] !== undefined)
            details += '<b>Bytes Out (uploaded): </b>' + NumBytesAsDisplayString(r['bytesOut']) + '<br>';
        if (r['cpuTime'] !== undefined && r['cpuTime'] > 0)
            details += '<b>CPU Time: </b>' + r['cpuTime'] + ' ms<br>';
        if (r['renderBlocking'] !== undefined) {
            details += '<b>Render Blocking Status: </b>' + htmlEncode(r['renderBlocking']) + '<br>';

            if (r['renderBlocking']=== 'blocking') {
                experiment += '</ul><ul class="experiments"><li><a href="#" data-spof="' + htmlEncode(r['host']) + '">Run a <abbr title="Single Point of Failure">SPOF</abbr> Test (Runs in a new tab)</a></li>';
            }
        }
            
            
        var psPageData = wptPageData[stepLabel] !== undefined ? wptPageData[stepLabel]['psPageData'] : undefined;
        if (psPageData !== undefined &&
            psPageData['connections'] !== undefined &&
            r['socket'] !== undefined &&
            psPageData['connections'][r['socket']] !== undefined &&
            psPageData['connections'][r['socket']]['streams'] !== undefined) {
          var priority_streams = psPageData['connections'][r['socket']]['streams'];
          details += '<b>HTTP/2 Priority-Only Streams: </b><br>';
          for (stream in priority_streams) {
            details += '&nbsp;&nbsp;&nbsp;&nbsp;' + htmlEncode(stream) + ':';
            if (priority_streams[stream]['weight'] !== undefined)
              details += " weight = " + htmlEncode(priority_streams[stream]['weight']);
            if (priority_streams[stream]['depends_on'] !== undefined)
              details += " depends on " + htmlEncode(priority_streams[stream]['depends_on']);
            if (priority_streams[stream]['exclusive'] !== undefined && priority_streams[stream]['exclusive'] > 0)
              details += " EXCLUSIVE";
            details += '<br>';
          }
        }
        if (r['headers'] !== undefined){
            if (r.headers['request'] !== undefined){
                for (i=0;i<r.headers.request.length;i++) {
                    requestHeaders += htmlEncode(r.headers.request[i]) + '<br>';
                }
            }
            if (r.headers['response'] !== undefined){
                for (i=0;i<r.headers.response.length;i++) {
                    responseHeaders += htmlEncode(r.headers.response[i]) + '<br>';
                }
            }
        }
        if (r['body_url'] !== undefined && r['body_url'].length) {
            details += '<a href="' + htmlEncode(r['body_url']) + '" target="_blank">Open response body in new window</a><br>'
            try {
                $("#response-body-" + stepLabel).text('Loading...');
                wptBodyRequest = new XMLHttpRequest();
                wptBodyRequest.open('GET', r['body_url'], true);
                wptBodyRequest.onreadystatechange = function() {
                if (wptBodyRequest.readyState == 4) {
                    if (wptBodyRequest.status == 200) {
                        $("#response-body-" + stepLabel).text(wptBodyRequest.responseText);
                    } else {
                        $("#response-body-" + stepLabel).text('');
                    }
                }
              }
              wptBodyRequest.send();
            } catch (err) {
            }
        } else if (r['contentType'] !== undefined && r['contentType'].indexOf('image') >= 0) {
            if (wptNoLinks) {
                $("#response-body-" + stepLabel).html('<img style="max-width:100%; max-height:100%;" src="' + r['full_url'] + '">');
            } else {
                $("#response-body-" + stepLabel).html('<a href="' + r['full_url'] + '"><img style="max-width:100%; max-height:100%;" src="' + r['full_url'] + '"></a>');
            }
        } else {
            $("#response-body-" + stepLabel).html('Not Available.<br><br>Turn on the "Save Response Bodies" option in the advanced settings to capture text resources.');
        }
    }
    $("#request-details-" + stepLabel).html(details);
    $("#request-headers-" + stepLabel).html(requestHeaders);
    $("#response-headers-" + stepLabel).html(responseHeaders);
    if (document.getElementById('urlEntry')) {
        //only do experiments if on a page where we can resubmit the test
        $("#experiment-" + stepLabel).html(experiment + "</ul>");
    } else {
        var experimentButtons = document.querySelectorAll("[id^='experiment-button']");
        if (experimentButtons) {
            for (var i = 0, len = experimentButtons.length; i < len; i++) {
                experimentButtons[i].style.display = "none";
            }
        }
    }
    
    $("#request-raw-details-json-" + stepLabel).text(json);
    $('#request-dialog-' + stepLabel).jqmShow();

    // highlight the selected request
    for (i=1;i<=wptRequestCount[stepLabel];i++) {
        if (i == request)
            $("#request-overlay-" + stepLabel + "-" + i).addClass("selected");
        else
            $("#request-overlay-" + stepLabel + "-" + i).removeClass("selected");
    }
}

// support for the multi-waterfall translucency
$(".waterfall-transparency").change(function() {
    var newValue = this.value;
    var id = this.name;
    $("#" + id).css({ opacity: newValue });
});

$(".waterfall-transparency").on('input', function() {
    var newValue = this.value;
    var id = this.name;
    $("#" + id).css({ opacity: newValue });
});

if (document.getElementById('urlEntry')) {
    $('.waterfall-container').on("click", "a[data-spof]", function (e) {
        $('#urlEntry').append('<input type="hidden" name="spof" value="' + $(this).attr("data-spof") + '"/>');
        $('#urlEntry').attr('target', "_blank");
        if (window.grecaptcha) {
            grecaptcha.execute();
        } else {
            $('#urlEntry').submit();
        }
        
        return false;
    })
    $('.waterfall-container').on("click", "a[data-block]", function (e) {
        if ($('#experimentSettings h2').length <= 0) {
            createExperimentSettingsBox();
        }
        $('#experimentSettings').removeClass('inactive');
        if ($('#experimentForm input[name=block]').length > 0) {
            var fieldVal = $('#experimentForm input[name=block]').val();
            if (fieldVal.indexOf($(this).attr("data-block")) >= 0) {
                return false;
            }
            else {
                $('#experimentForm input[name=block]').val(fieldVal + $(this).attr("data-block") + ' ' );
            }
            
        } else {
            $('#experimentForm').append('<input type="hidden" name="block" value="' + $(this).attr("data-block") + ' "/>');
        }
        $('#experimentSettings .block-list').append('<li><a href="#" title="Remove" data-remove-field="block" data-remove-val="' + $(this).attr("data-block") + '">x</a>' + $(this).attr("data-block") + '</li>');


        return false;
    })
    $('.waterfall-container').on("click", "a[data-block-domain]", function (e) {
        if ($('#experimentSettings h2').length <= 0) {
            createExperimentSettingsBox();
        }
        $('#experimentSettings').removeClass('inactive');
        if ($('#experimentForm input[name=blockDomains]').length > 0) {
            var fieldVal = $('#experimentForm input[name=blockDomains]').val();
            if (fieldVal.indexOf($(this).attr("data-block-domain")) >= 0) {
                return false;
            } else {
                $('#experimentForm input[name=blockDomains]').val(fieldVal + $(this).attr("data-block-domain") + ' ');
            }
            
        } else {
            $('#experimentForm').append('<input type="hidden" name="blockDomains" value="' + $(this).attr("data-block-domain") + ' "/>');
        }
        $('#experimentSettings .blockDomain-list').append('<li><a href="#" title="Remove" data-remove-field="blockDomains" data-remove-val="' + $(this).attr("data-block-domain") + '">x</a>' + $(this).attr("data-block-domain") + '</li>');

        return false;
    })
    function createExperimentSettingsBox() {
        $('#experimentSettings').prepend("<h2>Block URLs:</h2><ul class='block-list'></ul><h2>Block Domains:</h2><ul class='blockDomain-list'></ul>");
        $('#experimentSettings form').prepend('<label for="label">Label</label><input type="text" name="label" />');
    }
    $('body').on("click", "a[data-remove-field]", function (e) {
        var remove = $(this).attr('data-remove-field');
        var fieldVal = $('#experimentForm input[name=' + remove + ']').val();
        $('#experimentForm input[name=' + remove + ']').val(fieldVal.replace($(this).attr('data-remove-val') + ' ', ''));
        $(this).closest('li').remove();
        //check to see if any li, if not, hide the field
        if ($('#experimentSettings li').length <= 0) {
            $('#experimentSettings').addClass('inactive');
        }
        return false;
    })
}