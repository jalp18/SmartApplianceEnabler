#!/bin/bash
# 
# Benachrichtigung �ber prowl verschicken - www.prowlapp.com
#
senderId=$1
# Name des Ger�tes in Device2EM.xml
deviceName=$2
# Typ des Ger�tes in Device2EM.xml
deviceType=$3
# Hersteller des Ger�tes in Device2EM.xml
deviceVendor=$4
# Seriennummer des Ger�tes in Device2EM.xml
deviceSerial=$5
# Benachrichtigungs-Key des Ereignisses (z.B. CONTROL_OFF)
key=$6
# Benachrichtigungs-Text des Ereignisses (z.B. "Das Ger�t wurde ausgeschaltet")
text=$7

# apikey f�r prowl angeben
apikey=[eigenen API Key hier eintragen (ohne Klammer)]

#Benachrichtigungspriorit�t festlegen
   #Default value of 0 if not provided. An integer value ranging [-2, 2] representing:
   #-2 Very Low
   #-1 Moderate
   # 0 Normal
   # 1 High
   # 2 Emergency
   #Emergency priority messages may bypass quiet hours according to the user's settings.

#Prio auf 0 setzen f�r alle nicht genannten F�lle
prio=0
#F�r nachfolgende F�lle andere Priorit�ten auf Basis des Benachrichtungs-Key festlegen
case "$key" in
  COMMUNICATION_ERROR) prio=2 ;;
  EVCHARGER_ERROR) prio=2 ;;
  EVCHARGER_CHARGING_COMPLETED) prio=1 ;;
  EVCHARGER_VEHICLE_NOT_CONNECTED) prio=1 ;;
  EVCHARGER_CHARGING) prio=0 ;;
  CONTROL_ON) prio=-1 ;;
  CONTROL_OFF) prio=-2 ;;
esac


if [ $# -ne 7 ]; then
# Benachrichtung �ber prowl wenn etwas bei den Parametern nicht passt
echo "One ore more parameter is missing!"
call=`curl -s -d "apikey=$apikey&priority=$prio&application=SAE-Enabler&event=ERROR&description=Ein oder meherer Parameter fehlen" https://api.prowlapp.com/publicapi/add`

else

# Send off the message to prowl
call=`curl -s -d "apikey=$apikey&priority=$prio&application=SAE-Enabler&event=$deviceName&description=$text" https://api.prowlapp.com/publicapi/add`
fi