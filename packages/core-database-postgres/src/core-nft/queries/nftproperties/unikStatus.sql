SELECT count(*) FILTER (where key='type' AND value='1') AS individual
     , count(*) FILTER (where key='type' AND value='2') AS organization
     , count(*) FILTER (where key='type' AND value='3') AS network
FROM nftproperties;
