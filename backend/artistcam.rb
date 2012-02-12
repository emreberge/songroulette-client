# myapp.rb
require 'sinatra'

sessionIds = Hash.new()

get '/sessionID/:artistURI' do
    if !sessionIds[params[:artistURI]]
        sessionIds[params[:artistURI]] = create_session()
    end
    sessionIds[params[:artistURI]].to_s
end

get '/token/:sessionID' do
    generate_token(params[:sessionID])
end

# Opentok

def create_session()
    rand(100)
end

def generate_token(sessionID)
    "Not Implemented, sessionID: #{sessionID}"
end